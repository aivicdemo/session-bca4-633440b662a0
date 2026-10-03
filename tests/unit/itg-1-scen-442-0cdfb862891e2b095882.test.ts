import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';

describe('SCEN-442: 検索結果の出力に検索実行時刻がISO 8601形式で含まれる', () => {
  it('検索実行時刻がISO 8601形式に準拠して返される', () => {
    const leaderId = 'leader001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    // テスト実行前の時刻を記録
    const beforeCall = new Date();

    const result = retrieveDailyReportsForLeaderReview({
      leaderId,
      startDate,
      endDate,
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: 'reportDate',
      pageNumber: 1,
      pageSize: 50,
    });

    // テスト実行後の時刻を記録
    const afterCall = new Date();

    // retrievedAt フィールドが存在することを確認
    expect(result).toHaveProperty('retrievedAt');
    expect(result.retrievedAt).toBeTruthy();

    // retrievedAt の値が ISO 8601形式に準拠していることを確認
    // RFC 3339形式（YYYY-MM-DDTHH:mm:ss.sssZ または YYYY-MM-DDTHH:mm:ss+HH:mm など）
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    // retrievedAt が検索実行時点の時刻を表していることを確認
    // テスト実行前後の時刻範囲内であること
    const retrievedAtTime = new Date(result.retrievedAt);
    expect(retrievedAtTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 1000);
    expect(retrievedAtTime.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
  });
});
