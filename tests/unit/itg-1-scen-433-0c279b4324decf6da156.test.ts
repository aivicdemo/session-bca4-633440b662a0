import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-433: リーダーが提出状態を\'submitted\'に指定して検索し、提出済み日報だけが返される', () => {
  it('提出状態を\'submitted\'に指定して検索し、提出済み日報だけが返される', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-14',
      endDate: '2024-01-15',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    // 提出状態が'submitted'のレコードのみが返される
    result.dailyReports.forEach((report) => {
      expect(report.submittedAt).toBeDefined();
      expect(typeof report.submittedAt).toBe('string');
    });

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
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
  });
});
