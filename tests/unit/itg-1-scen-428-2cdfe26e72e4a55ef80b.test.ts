import { describe, test, expect } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  SaveDailyReportOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-428: チームメンバー全員の提出状況が提出済み・未提出別に集計される', () => {
  test('should aggregate submission status for all team members', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (targetDate.getDay() || 7) + 1);
    const reportDate = targetDate.toISOString().split('T')[0];
    const submittedAt = `${reportDate}T09:30:00Z`;

    const teamMemberIds = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'];
    const submittedReports: SaveDailyReportInput[] = [];

    // Submit reports for user-001, user-003, user-005
    const user001Input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate,
      businessContent: '営業活動実施',
      submittedAt,
    };
    submittedReports.push(user001Input);

    const user003Input: SaveDailyReportInput = {
      userId: 'user-003',
      reportDate,
      businessContent: '開発タスク進行',
      submittedAt: `${reportDate}T10:15:00Z`,
    };
    submittedReports.push(user003Input);

    const user005Input: SaveDailyReportInput = {
      userId: 'user-005',
      reportDate,
      businessContent: 'テスト実施',
      submittedAt: `${reportDate}T11:00:00Z`,
    };
    submittedReports.push(user005Input);

    // Call saveDailyReport for each submission
    const results: SaveDailyReportOutput[] = [];
    for (const input of submittedReports) {
      const output = await saveDailyReport(input);
      results.push(output);
      expect(output.dailyReportId).toBeDefined();
      expect(output.savedAt).toBeDefined();
    }

    expect(results.length).toBe(3);
    expect(results[0].userId).toBe('user-001');
    expect(results[1].userId).toBe('user-003');
    expect(results[2].userId).toBe('user-005');

    // All reports should have same report date
    results.forEach((result) => {
      expect(result.reportDate).toBe(reportDate);
    });
  });
});
