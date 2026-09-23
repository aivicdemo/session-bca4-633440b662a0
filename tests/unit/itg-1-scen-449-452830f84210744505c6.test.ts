import { describe, it, expect } from '@jest/globals';
import {
  archivePastDailyReports,
  NoReportsToArchiveError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-449: アーカイブ対象の日報レコードが存在しない場合', () => {
  it('NoReportsToArchiveErrorを発生させる', async () => {
    const input = {
      userId: 'user-001',
      archivedAt: '2024-01-15T10:00:00Z',
    };

    await expect(archivePastDailyReports(input)).rejects.toThrow(
      NoReportsToArchiveError
    );
    await expect(archivePastDailyReports(input)).rejects.toThrow(
      'ユーザーID user-001 のアーカイブ対象日報はありません。'
    );
  });
});
