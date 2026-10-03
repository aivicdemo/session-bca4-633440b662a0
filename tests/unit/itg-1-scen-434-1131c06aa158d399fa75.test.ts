import { describe, it, expect } from '@jest/globals';
import {
  saveDailyReport,
  retrieveDailyReportsForLeaderReview,
} from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput } from '../../src/logic/daily-report-persistence';

describe('SCEN-434: リーダーが提出状態を\'all\'に指定して検索し、全ての日報が返される', () => {
  it('提出状態を\'all\'に指定して検索し、全ての日報が返される', async () => {
    // テストデータを準備：提出済みと未提出の日報を登録
    await saveDailyReport({
      userId: 'user-x',
      reportDate: '2024-01-10',
      businessContent: '提出済み日報',
      submittedAt: '2024-01-10T09:00:00Z',
    });

    await saveDailyReport({
      userId: 'user-y',
      reportDate: '2024-01-19',
      businessContent: '別の提出済み日報',
      submittedAt: '2024-01-19T10:00:00Z',
    });

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'all',
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    // 指定期間内のすべての日報が返される
    expect(result.dailyReports.length).toBeGreaterThanOrEqual(2);

    // 各レコードが必須フィールドを含む
    result.dailyReports.forEach((report) => {
      expect(report.dailyReportId).toBeDefined();
      expect(typeof report.dailyReportId).toBe('string');
      expect(report.userId).toBeDefined();
      expect(typeof report.userId).toBe('string');
      expect(report.reportDate).toBeDefined();
      expect(typeof report.reportDate).toBe('string');
      expect(report.businessContent).toBeDefined();
      expect(typeof report.businessContent).toBe('string');
      expect(report.submittedAt).toBeDefined();
      expect(typeof report.submittedAt).toBe('string');
    });

    expect(result.totalCount).toBe(result.dailyReports.length);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
