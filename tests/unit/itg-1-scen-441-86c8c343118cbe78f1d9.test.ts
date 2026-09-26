import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';

describe('SCEN-441: 検索対象期間に複数の日報が存在する場合、totalCountにフィルター条件に合致した全日報件数が返される', () => {
  it('filterBySubmissionStatus="submitted"で複数の提出済み日報が存在する場合、totalCountが正確に返される', () => {
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const result = retrieveDailyReportsForLeaderReview({
      leaderId,
      startDate,
      endDate,
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    // dailyReports 配列に複数の DailyReportForLeaderReview レコードが含まれる
    expect(result.dailyReports.length).toBeGreaterThanOrEqual(5);

    // 各レコードが必要な5つのフィールドをすべて含んでいることを検証
    result.dailyReports.forEach((report) => {
      expect(report).toHaveProperty('dailyReportId');
      expect(report).toHaveProperty('userId');
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('businessContent');
      expect(report).toHaveProperty('submittedAt');
      // 各フィールドが空でないことを確認
      expect(report.dailyReportId).toBeTruthy();
      expect(report.userId).toBeTruthy();
      expect(report.reportDate).toBeTruthy();
      expect(report.businessContent).toBeTruthy();
      expect(report.submittedAt).toBeTruthy();
    });

    // totalCount が指定期間・filterBySubmissionStatus='submitted' の条件に合致した全提出済み日報件数と一致
    expect(result.totalCount).toBe(result.dailyReports.length);
    expect(result.totalCount).toBeGreaterThanOrEqual(5);

    // デフォルト値を確認
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    // retrievedAt が ISO 8601形式で返されることを確認
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?/);
  });
});
