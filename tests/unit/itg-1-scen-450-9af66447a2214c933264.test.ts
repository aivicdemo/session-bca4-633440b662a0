import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/daily-report-persistence');

import {
  archivePastDailyReports,
  ArchiveOperationFailedError,
  ArchivePastDailyReportsInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-450: データベースのアーカイブ状態更新処理が失敗したとき、ArchiveOperationFailedErrorを発生させる', () => {
  it('ArchiveOperationFailedErrorが発生し、エラー文言が正しく返される', async () => {
    const error = new ArchiveOperationFailedError('日報のアーカイブ処理に失敗しました。');
    (archivePastDailyReports as jest.Mock).mockRejectedValueOnce(error);

    const input: ArchivePastDailyReportsInput = {
      userId: 'user-123',
      archivedAt: '2025-01-15T10:00:00Z',
    };

    try {
      await archivePastDailyReports(input);
      fail('ArchiveOperationFailedErrorが発生するはずです');
    } catch (caughtError) {
      expect(caughtError).toBeInstanceOf(ArchiveOperationFailedError);
      expect((caughtError as any).message).toBe('日報のアーカイブ処理に失敗しました。');
    }
  });
});
