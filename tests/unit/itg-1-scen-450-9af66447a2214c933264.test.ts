import { describe, it, expect } from '@jest/globals';
import {
  archivePastDailyReports,
  ArchiveOperationFailedError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-450: データベースのアーカイブ状態更新処理が失敗した場合', () => {
  it('ArchiveOperationFailedErrorを発生させる', async () => {
    const input = {
      userId: 'user-123',
      archivedAt: '2025-01-15T10:00:00Z',
    };

    await expect(archivePastDailyReports(input)).rejects.toThrow(
      ArchiveOperationFailedError
    );
    await expect(archivePastDailyReports(input)).rejects.toThrow(
      '日報のアーカイブ処理に失敗しました。'
    );
  });
});
