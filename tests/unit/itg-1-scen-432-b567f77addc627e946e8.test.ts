import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-432: リーダーがユーザーIDでフィルターして日報を検索し、該当ユーザーの日報のみが返される', () => {
  it('ユーザーIDでフィルターして日報を検索し、該当ユーザーの日報のみが返される', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: 'user002',
      filterBySubmissionStatus: 'submitted',
      sortBy: 'reportDate',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    // filterByUserIdが'user002'で絞り込まれた全件数
    expect(result.totalCount).toBeGreaterThan(0);

    // 返却された日報はすべてuser002のものである
    result.dailyReports.forEach((report) => {
      expect(report.userId).toBe('user002');
    });

    // 各レコードが必須フィールドを含む
    result.dailyReports.forEach((report) => {
      expect(report.dailyReportId).toBeDefined();
      expect(typeof report.dailyReportId).toBe('string');
      expect(report.userId).toBe('user002');
      expect(report.reportDate).toBeDefined();
      expect(typeof report.reportDate).toBe('string');
      expect(report.businessContent).toBeDefined();
      expect(typeof report.businessContent).toBe('string');
      expect(report.submittedAt).toBeDefined();
      expect(typeof report.submittedAt).toBe('string');
    });

    // 報告日の降順でソート
    for (let i = 0; i < result.dailyReports.length - 1; i++) {
      expect(result.dailyReports[i].reportDate >= result.dailyReports[i + 1].reportDate).toBe(true);
    }

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
  });
});
