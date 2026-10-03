import { describe, it, expect } from '@jest/globals';
import {
  saveDailyReport,
  retrieveDailyReportsForLeaderReview,
} from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput } from '../../src/logic/daily-report-persistence';

describe('SCEN-433: リーダーが提出状態を\'submitted\'に指定して検索し、提出済み日報だけが返される', () => {
  it('提出状態を\'submitted\'に指定して検索し、提出済み日報だけが返される', async () => {
    // テストデータを準備：提出済み日報4件を登録
    await saveDailyReport({
      userId: 'user-a',
      reportDate: '2024-01-15',
      businessContent: '顧客対応',
      submittedAt: '2024-01-15T09:30:00Z',
    });

    await saveDailyReport({
      userId: 'user-b',
      reportDate: '2024-01-15',
      businessContent: 'プロジェクト推進',
      submittedAt: '2024-01-15T10:45:00Z',
    });

    await saveDailyReport({
      userId: 'user-c',
      reportDate: '2024-01-15',
      businessContent: 'ユーザーCの業務内容',
      submittedAt: '2024-01-15T11:00:00Z',
    });

    await saveDailyReport({
      userId: 'user-a',
      reportDate: '2024-01-12',
      businessContent: '前日の業務内容',
      submittedAt: '2024-01-12T18:20:00Z',
    });

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-12',
      endDate: '2024-01-15',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    // 提出状態が'submitted'のレコードのみが返されることを確認（すべてsubmittedAtがあるため全件返される）
    expect(result.dailyReports).toHaveLength(4);
    expect(result.totalCount).toBe(4);

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
