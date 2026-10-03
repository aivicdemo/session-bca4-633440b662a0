import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput } from '../../src/logic/daily-report-persistence';

describe('SCEN-439: リーダーがページネーションを指定しないで検索し、デフォルトの50件単位で日報が返される', () => {
  it('should return reports with default pagination of 50 items per page', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.dailyReports).toBeDefined();
    expect(Array.isArray(result.dailyReports)).toBe(true);
    expect(result.dailyReports.length).toBeLessThanOrEqual(50);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    if (result.totalCount > 50) {
      expect(result.dailyReports.length).toBe(50);
    } else {
      expect(result.dailyReports.length).toBe(result.totalCount);
    }

    result.dailyReports.forEach((report) => {
      expect(report.dailyReportId).toBeDefined();
      expect(report.userId).toBeDefined();
      expect(report.reportDate).toBeDefined();
      expect(report.businessContent).toBeDefined();
      expect(report.submittedAt).toBeDefined();
    });
  });
});
