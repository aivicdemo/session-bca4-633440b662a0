import { describe, it, expect } from '@jest/globals';
import {
  saveDailyReport,
  retrieveDailyReportsForLeaderReview,
} from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput } from '../../src/logic/daily-report-persistence';

describe('SCEN-437: リーダーがソート対象を\'userId\'に指定して検索し、ユーザーIDでソートされた日報が返される', () => {
  it('ソート対象を\'userId\'に指定して検索し、ユーザーIDでソートされた日報が返される', async () => {
    // テストデータを準備：異なるユーザーIDのレコード
    await saveDailyReport({
      userId: 'user-charlie',
      reportDate: '2024-01-15',
      businessContent: 'チャーリーの業務',
      submittedAt: '2024-01-15T10:00:00Z',
    });

    await saveDailyReport({
      userId: 'user-alice',
      reportDate: '2024-01-15',
      businessContent: 'アリスの業務',
      submittedAt: '2024-01-15T09:00:00Z',
    });

    await saveDailyReport({
      userId: 'user-bob',
      reportDate: '2024-01-15',
      businessContent: 'ボブの業務',
      submittedAt: '2024-01-15T11:00:00Z',
    });

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: 'userId',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    // userId フィールドで昇順ソート
    for (let i = 0; i < result.dailyReports.length - 1; i++) {
      const current = result.dailyReports[i].userId;
      const next = result.dailyReports[i + 1].userId;
      expect(current <= next).toBe(true);
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
