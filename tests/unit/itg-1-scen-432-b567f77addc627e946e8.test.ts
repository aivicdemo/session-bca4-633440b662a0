import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
  DailyReportForLeaderReview,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-432: リーダーがユーザーIDでフィルターして日報を検索し、該当ユーザーの日報のみが返される', () => {
  it('filterByUserIdが指定されたとき、該当ユーザーの日報のみが返される', async () => {
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

    const result: RetrieveDailyReportsForLeaderReviewOutput =
      await retrieveDailyReportsForLeaderReview(input);

    expect(result).toBeDefined();
    expect(result.dailyReports).toBeDefined();
    expect(Array.isArray(result.dailyReports)).toBe(true);

    // user002 の日報のみ 4 件が返却される
    expect(result.dailyReports.length).toBe(4);

    // 全てのレコードが user002 であることを確認
    result.dailyReports.forEach((report: DailyReportForLeaderReview) => {
      expect(report.userId).toBe('user002');
      expect(report.dailyReportId).toBeDefined();
      expect(typeof report.dailyReportId).toBe('string');
      expect(report.reportDate).toBeDefined();
      expect(typeof report.reportDate).toBe('string');
      expect(report.businessContent).toBeDefined();
      expect(typeof report.businessContent).toBe('string');
      expect(report.submittedAt).toBeDefined();
      expect(typeof report.submittedAt).toBe('string');
    });

    // 報告日の降順（2024-01-20, 2024-01-12, 2024-01-08, 2024-01-03）で並んでいることを確認
    expect(result.dailyReports[0].reportDate).toBe('2024-01-20');
    expect(result.dailyReports[1].reportDate).toBe('2024-01-12');
    expect(result.dailyReports[2].reportDate).toBe('2024-01-08');
    expect(result.dailyReports[3].reportDate).toBe('2024-01-03');

    // totalCount は filterByUserId で絞り込まれた全件数の 4 件
    expect(result.totalCount).toBe(4);

    // ページネーション情報
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    // retrievedAt は ISO 8601 形式の文字列
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    // ISO 8601 形式の簡易検証
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(
      true
    );
  });
});
