import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput } from '../../src/logic/daily-report-persistence';

describe('SCEN-440: リーダーがソート対象を指定しないで検索し、報告日の降順で日報が返される', () => {
  it('should return daily reports sorted by reportDate in descending order when sortBy is undefined', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result).toBeDefined();
    expect(result.dailyReports).toBeDefined();
    expect(Array.isArray(result.dailyReports)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    if (result.dailyReports.length > 1) {
      for (let i = 0; i < result.dailyReports.length - 1; i++) {
        const current = new Date(result.dailyReports[i].reportDate);
        const next = new Date(result.dailyReports[i + 1].reportDate);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    }

    result.dailyReports.forEach((report) => {
      expect(report).toHaveProperty('dailyReportId');
      expect(report).toHaveProperty('userId');
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('businessContent');
      expect(report).toHaveProperty('submittedAt');
    });
  });
});
