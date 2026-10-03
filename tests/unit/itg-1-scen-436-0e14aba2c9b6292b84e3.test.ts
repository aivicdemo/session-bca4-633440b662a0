import { describe, it, expect } from '@jest/globals';
import {
  saveDailyReport,
  retrieveDailyReportsForLeaderReview,
} from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput } from '../../src/logic/daily-report-persistence';

describe('SCEN-436: リーダーがソート対象を\'submittedAt\'に指定して検索し、提出時刻でソートされた日報が返される', () => {
  it('ソート対象を\'submittedAt\'に指定して検索し、提出時刻でソートされた日報が返される', async () => {
    // テストデータを準備：異なる提出時刻のレコード
    await saveDailyReport({
      userId: 'user-sort-1',
      reportDate: '2024-01-02',
      businessContent: '2番目の提出',
      submittedAt: '2024-01-02T07:45:00Z',
    });

    await saveDailyReport({
      userId: 'user-sort-2',
      reportDate: '2024-01-01',
      businessContent: '最初の提出',
      submittedAt: '2024-01-01T08:30:00Z',
    });

    await saveDailyReport({
      userId: 'user-sort-3',
      reportDate: '2024-01-01',
      businessContent: '3番目の提出',
      submittedAt: '2024-01-01T09:15:00Z',
    });

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: 'submittedAt',
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    // submittedAt フィールドの時系列で昇順ソート
    for (let i = 0; i < result.dailyReports.length - 1; i++) {
      const current = new Date(result.dailyReports[i].submittedAt).getTime();
      const next = new Date(result.dailyReports[i + 1].submittedAt).getTime();
      expect(current).toBeLessThanOrEqual(next);
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
