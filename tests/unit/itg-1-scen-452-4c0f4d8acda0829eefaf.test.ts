import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  archivePastDailyReports,
  saveDailyReport,
  type ArchivePastDailyReportsInput,
  type ArchivePastDailyReportsOutput,
  type SaveDailyReportInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-452: 入力の archivedAt が ISO 8601形式の有効な日時のとき', () => {
  beforeEach(async () => {
    // Prepare: user-scan-452にアーカイブ対象の日報を作成
    const report: SaveDailyReportInput = {
      userId: 'user-scan-452',
      reportDate: '2023-12-28',
      businessContent: 'ISO形式テスト用の業務内容',
      submittedAt: '2023-12-28T18:00:00Z',
    };

    await saveDailyReport(report);
  });

  it('その日時を出力に含めて返す', async () => {
    const isoTimestamp = '2024-01-15T09:30:00Z';
    const input: ArchivePastDailyReportsInput = {
      userId: 'user-scan-452',
      archivedAt: isoTimestamp,
    };

    const result: ArchivePastDailyReportsOutput = await archivePastDailyReports(input);

    expect(result.archivedAt).toBe(isoTimestamp);
    expect(result.userId).toBe('user-scan-452');
    expect(result.archivedReportCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.archivedReportCount).toBe('number');
  });
});
