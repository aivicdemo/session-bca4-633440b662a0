import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
  DailyReportForLeaderReview,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-440: リーダーがソート対象を指定しないで検索し、報告日の降順で日報が返される', () => {
  it('ソート条件を指定しないで検索した結果、報告日の降順で日報が返される', async () => {
    const leaderId = 'leader001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId,
      startDate,
      endDate,
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: RetrieveDailyReportsForLeaderReviewOutput = await retrieveDailyReportsForLeaderReview(input);

    expect(result).toBeDefined();
    expect(result.dailyReports).toBeDefined();
    expect(Array.isArray(result.dailyReports)).toBe(true);
    expect(result.dailyReports.length).toBe(3);

    result.dailyReports.forEach((report: DailyReportForLeaderReview) => {
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

    const reportDates = result.dailyReports.map((r: DailyReportForLeaderReview) => r.reportDate);
    expect(reportDates[0]).toBe('2024-01-20');
    expect(reportDates[1]).toBe('2024-01-15');
    expect(reportDates[2]).toBe('2024-01-10');

    const sortedDates = [...reportDates].sort().reverse();
    expect(reportDates).toEqual(sortedDates);

    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/;
    expect(result.retrievedAt).toMatch(isoDateRegex);
  });
});
