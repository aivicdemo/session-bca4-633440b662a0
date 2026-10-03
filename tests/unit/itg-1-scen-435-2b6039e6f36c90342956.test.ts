import { describe, it, expect } from '@jest/globals';
import {
  saveDailyReport,
  retrieveDailyReportsForLeaderReview,
} from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput } from '../../src/logic/daily-report-persistence';

describe('SCEN-435: リーダーがソート対象を\'reportDate\'に指定して検索し、報告日の降順で日報が返される', () => {
  it('ソート対象を\'reportDate\'に指定して検索し、報告日の降順で日報が返される', async () => {
    // テストデータを準備：異なる報告日のレコード
    await saveDailyReport({
      userId: 'user-002',
      reportDate: '2024-01-15',
      businessContent: '中日の業務',
      submittedAt: '2024-01-15T10:30:00Z',
    });

    await saveDailyReport({
      userId: 'user-003',
      reportDate: '2024-01-19',
      businessContent: '後日の業務',
      submittedAt: '2024-01-19T14:15:00Z',
    });

    await saveDailyReport({
      userId: 'user-001',
      reportDate: '2024-01-10',
      businessContent: '初日の業務',
      submittedAt: '2024-01-10T09:45:00Z',
    });

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: 'reportDate',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    // reportDate フィールドで降順ソート（新しい日付から古い日付）
    expect(result.dailyReports.length).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < result.dailyReports.length - 1; i++) {
      const current = result.dailyReports[i].reportDate;
      const next = result.dailyReports[i + 1].reportDate;
      expect(current >= next).toBe(true);
    }

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

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
