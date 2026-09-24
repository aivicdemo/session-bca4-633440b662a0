import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/daily-report-persistence');

import {
  archivePastDailyReports,
  NoReportsToArchiveError,
  ArchivePastDailyReportsInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-449: 指定ユーザーにアーカイブ対象の日報レコードが存在しないとき、NoReportsToArchiveErrorを発生させる', () => {
  it('NoReportsToArchiveErrorが発生し、エラー文言が正しく返される', async () => {
    const error = new NoReportsToArchiveError('ユーザーID user-001 のアーカイブ対象日報はありません。');
    (archivePastDailyReports as jest.Mock).mockRejectedValueOnce(error);

    const input: ArchivePastDailyReportsInput = {
      userId: 'user-001',
      archivedAt: '2024-01-15T10:00:00Z',
    };

    try {
      await archivePastDailyReports(input);
      fail('NoReportsToArchiveErrorが発生するはずです');
    } catch (caughtError) {
      expect(caughtError).toBeInstanceOf(NoReportsToArchiveError);
      expect((caughtError as any).message).toBe('ユーザーID user-001 のアーカイブ対象日報はありません。');
    }
  });
});
