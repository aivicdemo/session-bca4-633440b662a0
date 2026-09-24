import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
  DailyReportForLeaderReview,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-431: リーダーが指定期間内の提出済み日報を検索し、日報ID・ユーザーID・報告日・業務内容・提出時刻を含むレコードセットが返される', () => {
  test('指定期間内の提出済み日報が返却される', () => {
    // RetrieveDailyReportsForLeaderReviewInput を組み立てる
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: 1,
      pageSize: 50,
    };

    // retrieveDailyReportsForLeaderReview に渡して実行
    const result: RetrieveDailyReportsForLeaderReviewOutput = retrieveDailyReportsForLeaderReview(input);

    // 戻り値の RetrieveDailyReportsForLeaderReviewOutput を検証
    expect(result).toHaveProperty('dailyReports');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('pageNumber');
    expect(result).toHaveProperty('pageSize');
    expect(result).toHaveProperty('retrievedAt');

    // dailyReports 配列の各要素が DailyReportForLeaderReview 型として
    // 日報ID・ユーザーID・報告日・業務内容・提出時刻のフィールドを含む
    expect(Array.isArray(result.dailyReports)).toBe(true);
    result.dailyReports.forEach((report: DailyReportForLeaderReview) => {
      expect(report).toHaveProperty('dailyReportId');
      expect(report).toHaveProperty('userId');
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('content');
      expect(report).toHaveProperty('submissionTime');
    });

    // totalCount が検索条件に合致した提出済み日報の全件数を示す
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // pageNumber が 1 であることを確認
    expect(result.pageNumber).toBe(1);

    // pageSize が 50 であることを確認
    expect(result.pageSize).toBe(50);

    // retrievedAt が ISO 8601形式の有効なタイムスタンプであることを確認
    expect(typeof result.retrievedAt).toBe('string');
    const timestamp = new Date(result.retrievedAt);
    expect(isNaN(timestamp.getTime())).toBe(false);
  });
});
