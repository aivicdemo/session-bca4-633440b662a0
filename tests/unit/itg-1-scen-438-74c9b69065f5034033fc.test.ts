import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
  DailyReportForLeaderReview,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-438: リーダーがページネーションを指定して検索し、指定されたページ番号とページサイズの日報が返される', () => {
  it('ページ2、ページサイズ10を指定して検索した結果、オフセット10～19番目の日報が返される', async () => {
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const filterBySubmissionStatus = 'submitted';
    const pageNumber = 2;
    const pageSize = 10;

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId,
      startDate,
      endDate,
      filterBySubmissionStatus,
      pageNumber,
      pageSize,
    };

    const result: RetrieveDailyReportsForLeaderReviewOutput = await retrieveDailyReportsForLeaderReview(input);

    expect(result).toBeDefined();
    expect(result.dailyReports).toBeDefined();
    expect(Array.isArray(result.dailyReports)).toBe(true);
    expect(result.dailyReports.length).toBe(10);

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

    expect(result.totalCount).toBe(60);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/;
    expect(result.retrievedAt).toMatch(isoDateRegex);

    const reportDates = result.dailyReports.map((r: DailyReportForLeaderReview) => r.reportDate);
    const sortedDates = [...reportDates].sort().reverse();
    expect(reportDates).toEqual(sortedDates);
  });
});
