import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  archivePastDailyReports,
  saveDailyReport,
  NoReportsToArchiveError,
  type ArchivePastDailyReportsInput,
  type SaveDailyReportInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-449: 指定ユーザーにアーカイブ対象の日報レコードが存在しないとき', () => {
  beforeEach(async () => {
    // Prepare: ユーザーが存在し、かつ過去日報がすべてアーカイブ済み
    const report: SaveDailyReportInput = {
      userId: 'user-scan-449',
      reportDate: '2023-12-28',
      businessContent: '過去の業務内容',
      submittedAt: '2023-12-28T18:00:00Z',
    };

    // ユーザーを登録
    await saveDailyReport(report);

    // アーカイブして、アーカイブ対象を0件にする
    await archivePastDailyReports({
      userId: 'user-scan-449',
      archivedAt: '2024-01-01T00:00:00Z',
    });
  });

  it('NoReportsToArchiveError が発生し、エラー文言が「ユーザーID user-scan-449 のアーカイブ対象日報はありません。」である', async () => {
    const input: ArchivePastDailyReportsInput = {
      userId: 'user-scan-449',
      archivedAt: '2024-01-15T10:00:00Z',
    };

    await expect(archivePastDailyReports(input)).rejects.toThrow(NoReportsToArchiveError);
    await expect(archivePastDailyReports(input)).rejects.toThrow(
      'ユーザーID user-scan-449 のアーカイブ対象日報はありません。'
    );
  });
});
