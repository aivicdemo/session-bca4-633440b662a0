import { describe, it, expect } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  saveDailyReport,
  RetrieveDailyReportsForLeaderReviewInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-432: リーダーがユーザーIDでフィルターして日報を検索し、該当ユーザーの日報のみが返される', () => {
  it('ユーザーIDでフィルターして日報を検索し、該当ユーザーの日報のみが返される', async () => {
    // テスト用に複数ユーザーの日報を保存
    const reportDates = ['2024-01-03', '2024-01-08', '2024-01-12', '2024-01-20'];
    for (const reportDate of reportDates) {
      await saveDailyReport({
        userId: 'user002',
        reportDate: reportDate,
        businessContent: `user002 の日報 (${reportDate})`,
        submittedAt: reportDate + 'T10:00:00Z',
      });
    }

    // 他のユーザーの日報も保存
    await saveDailyReport({
      userId: 'user001',
      reportDate: '2024-01-05',
      businessContent: 'user001 の日報',
      submittedAt: '2024-01-05T09:00:00Z',
    });

    await saveDailyReport({
      userId: 'user003',
      reportDate: '2024-01-07',
      businessContent: 'user003 の日報',
      submittedAt: '2024-01-07T09:00:00Z',
    });

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: 'user002',
      filterBySubmissionStatus: 'submitted',
      sortBy: 'reportDate',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    // filterByUserIdが'user002'で絞り込まれた全件数
    expect(result.totalCount).toBeGreaterThanOrEqual(4);

    // 返却された日報はすべてuser002のものである
    result.dailyReports.forEach((report) => {
      expect(report.userId).toBe('user002');
    });

    // 各レコードが必須フィールドを含む
    result.dailyReports.forEach((report) => {
      expect(report.dailyReportId).toBeDefined();
      expect(typeof report.dailyReportId).toBe('string');
      expect(report.userId).toBe('user002');
      expect(report.reportDate).toBeDefined();
      expect(typeof report.reportDate).toBe('string');
      expect(report.businessContent).toBeDefined();
      expect(typeof report.businessContent).toBe('string');
      expect(report.submittedAt).toBeDefined();
      expect(typeof report.submittedAt).toBe('string');
    });

    // 報告日の降順でソート
    for (let i = 0; i < result.dailyReports.length - 1; i++) {
      expect(result.dailyReports[i].reportDate >= result.dailyReports[i + 1].reportDate).toBe(true);
    }

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
  });
});
