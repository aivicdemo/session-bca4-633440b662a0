import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  archivePastDailyReports,
  saveDailyReport,
  type ArchivePastDailyReportsInput,
  type ArchivePastDailyReportsOutput,
  type SaveDailyReportInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-451: 指定ユーザーの過去日報が1件だけ存在するとき', () => {
  beforeEach(async () => {
    // Prepare: user-scan-451に過去日報を1件だけ作成
    const report: SaveDailyReportInput = {
      userId: 'user-scan-451',
      reportDate: '2023-12-28',
      businessContent: '単一の業務内容',
      submittedAt: '2023-12-28T18:00:00Z',
    };

    await saveDailyReport(report);
  });

  it('アーカイブして件数1で返す', async () => {
    const input: ArchivePastDailyReportsInput = {
      userId: 'user-scan-451',
      archivedAt: '2024-01-15T09:00:00Z',
    };

    const result: ArchivePastDailyReportsOutput = await archivePastDailyReports(input);

    expect(result.userId).toBe('user-scan-451');
    expect(result.archivedReportCount).toBe(1);
    expect(result.archivedAt).toBe('2024-01-15T09:00:00Z');
  });
});
