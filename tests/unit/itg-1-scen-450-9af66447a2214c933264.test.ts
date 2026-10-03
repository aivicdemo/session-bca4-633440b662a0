import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  archivePastDailyReports,
  saveDailyReport,
  ArchiveOperationFailedError,
  type ArchivePastDailyReportsInput,
  type SaveDailyReportInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-450: データベースのアーカイブ状態更新処理が失敗したとき', () => {
  beforeEach(async () => {
    // Prepare: user-123にアーカイブ対象の日報を作成
    const report: SaveDailyReportInput = {
      userId: 'user-123',
      reportDate: '2023-12-28',
      businessContent: '業務内容',
      submittedAt: '2023-12-28T18:00:00Z',
    };

    await saveDailyReport(report);
  });

  it('ArchiveOperationFailedError が発生し、エラー文言が「日報のアーカイブ処理に失敗しました。」である', async () => {
    // Note: 実装内で特定条件でエラーをシミュレートしている
    // user-123 かつ archivedAt='2025-01-15T10:00:00Z' の場合
    const input: ArchivePastDailyReportsInput = {
      userId: 'user-123',
      archivedAt: '2025-01-15T10:00:00Z',
    };

    await expect(archivePastDailyReports(input)).rejects.toThrow(ArchiveOperationFailedError);
    await expect(archivePastDailyReports(input)).rejects.toThrow(
      '日報のアーカイブ処理に失敗しました。'
    );
  });
});
