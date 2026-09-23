import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-442: 検索結果の出力に検索実行時刻がISO 8601形式で含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('関数の戻り値の retrievedAt フィールドに、検索実行時刻が ISO 8601形式（RFC 3339）で格納されている', async () => {
    // テスト実行前の時刻を記録
    const beforeTime = new Date();

    // 入力値を構築
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: 'reportDate',
      pageNumber: 1,
      pageSize: 50,
    };

    // 関数を呼び出し
    const result: RetrieveDailyReportsForLeaderReviewOutput = await retrieveDailyReportsForLeaderReview(input);

    // テスト実行後の時刻を記録
    const afterTime = new Date();

    // 期待結果検証

    // (1) retrievedAt フィールドが存在すること
    expect(result.retrievedAt).toBeDefined();

    // (2) retrievedAt の値が ISO 8601形式に準拠していること
    // ISO 8601 形式: YYYY-MM-DDTHH:mm:ss.sssZ または YYYY-MM-DDTHH:mm:ss+HH:mm など
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?([+\-]\d{2}:\d{2})?$/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);

    // (3) retrievedAt が検索実行時点の時刻を表していること（テスト実行前後の時刻範囲内であること）
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000); // 1秒の余裕を持たせる
    expect(retrievedAtDate.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000); // 1秒の余裕を持たせる
  });
});
