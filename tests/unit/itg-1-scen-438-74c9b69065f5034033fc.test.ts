import { describe, it, expect } from '@jest/globals';
import {
  saveDailyReport,
  retrieveDailyReportsForLeaderReview,
} from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput } from '../../src/logic/daily-report-persistence';

describe('SCEN-438: リーダーがページネーションを指定して検索し、指定されたページ番号とページサイズの日報が返される', () => {
  it('ページネーションを指定して検索し、指定されたページ番号とページサイズの日報が返される', async () => {
    // テストデータを準備：60件の提出済み日報を登録（営業日のみ）
    const businessDays = [];
    for (let i = 10; i <= 31; i++) {
      const d = new Date(`2024-01-${String(i).padStart(2, '0')}T00:00:00Z`);
      const day = d.getUTCDay();
      if (day !== 0 && day !== 6) { // 営業日（平日）
        businessDays.push(i);
      }
    }

    for (let i = 0; i < 60; i++) {
      const dayOfMonth = businessDays[i % businessDays.length];
      const dateStr = `2024-01-${String(dayOfMonth).padStart(2, '0')}`;
      await saveDailyReport({
        userId: `user-pagination-${i % 10}`,
        reportDate: dateStr,
        businessContent: `業務内容${i + 1}`,
        submittedAt: `2024-01-${String(dayOfMonth).padStart(2, '0')}T${String((i % 24)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00Z`,
      });
    }

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: 2,
      pageSize: 10,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    // ページ2でページサイズ10なので、11～20番目のレコード（オフセット10～19）が返される
    expect(result.dailyReports).toHaveLength(10);
    expect(result.totalCount).toBe(60);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);

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

    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
