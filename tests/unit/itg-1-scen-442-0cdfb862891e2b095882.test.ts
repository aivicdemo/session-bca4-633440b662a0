import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-442: 検索結果の出力に検索実行時刻がISO 8601形式で含まれる', () => {
  it('retrieveDailyReportsForLeaderReview の戻り値に retrievedAt が ISO 8601形式で含まれる', async () => {
    const input = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted' as const,
      sortBy: 'reportDate' as const,
      pageNumber: 1,
      pageSize: 50,
    };

    const beforeTime = new Date();
    const result: RetrieveDailyReportsForLeaderReviewOutput = await retrieveDailyReportsForLeaderReview(input);
    const afterTime = new Date();

    // retrievedAt フィールドが存在することを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');

    // ISO 8601形式に準拠していることを確認
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(result.retrievedAt).toMatch(iso8601Pattern);

    // retrievedAt が検索実行時点の時刻を表していることを確認
    const retrievedAtTime = new Date(result.retrievedAt);
    expect(retrievedAtTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(retrievedAtTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());

    // その他の出力フィールドも検証
    expect(result.dailyReports).toBeDefined();
    expect(Array.isArray(result.dailyReports)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.pageNumber).toBeDefined();
    expect(typeof result.pageNumber).toBe('number');
    expect(result.pageSize).toBeDefined();
    expect(typeof result.pageSize).toBe('number');
  });
});
