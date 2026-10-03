import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  archivePastDailyReports,
  saveDailyReport,
  type ArchivePastDailyReportsInput,
  type ArchivePastDailyReportsOutput,
  type SaveDailyReportInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-447: 指定ユーザーの過去日報が複数件存在するとき、すべてアーカイブ状態に遷移', () => {
  beforeEach(async () => {
    // Prepare test data: user-001 に3件の過去日報を挿入
    const report1: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2023-12-28', // past business day
      businessContent: '業務内容1',
      submittedAt: '2023-12-28T18:00:00Z',
    };

    const report2: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2023-12-29', // past business day
      businessContent: '業務内容2',
      submittedAt: '2023-12-29T18:00:00Z',
    };

    const report3: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-10', // past business day
      businessContent: '業務内容3',
      submittedAt: '2024-01-10T18:00:00Z',
    };

    await saveDailyReport(report1);
    await saveDailyReport(report2);
    await saveDailyReport(report3);
  });

  it('すべてアーカイブ状態に遷移し件数と完了日時を返す', async () => {
    const input: ArchivePastDailyReportsInput = {
      userId: 'user-001',
      archivedAt: '2024-01-15T10:30:00Z',
    };

    const result: ArchivePastDailyReportsOutput = await archivePastDailyReports(input);

    expect(result.userId).toBe('user-001');
    expect(result.archivedReportCount).toBe(3);
    expect(result.archivedAt).toBe('2024-01-15T10:30:00Z');
  });
});
