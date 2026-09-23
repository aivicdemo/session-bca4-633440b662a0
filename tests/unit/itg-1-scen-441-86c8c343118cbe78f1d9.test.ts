import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  DailyReportForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-441: 検索対象期間に複数の日報が存在する場合、totalCountにフィルター条件に合致した全日報件数が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された期間・フィルター条件に基づいて提出済み日報一覧を検索し、totalCountが条件に合致した全件数を返す', async () => {
    // テストデータ準備: 2024-01-01 ～ 2024-01-31 の期間に提出済み日報が5件以上存在する前提
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId,
      startDate,
      endDate,
      filterBySubmissionStatus: 'submitted',
      filterByUserId: undefined,
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // 関数を呼び出し
    const result: RetrieveDailyReportsForLeaderReviewOutput = await retrieveDailyReportsForLeaderReview(input);

    // 期待結果検証

    // (1) dailyReports 配列に複数の DailyReportForLeaderReview レコードが含まれること
    expect(Array.isArray(result.dailyReports)).toBe(true);
    expect(result.dailyReports.length).toBeGreaterThan(0);

    // (2) 各レコードが日報ID・ユーザーID・報告日・業務内容・提出時刻の5つのフィールドをすべて保有すること
    result.dailyReports.forEach((record: DailyReportForLeaderReview) => {
      expect(record).toHaveProperty('dailyReportId');
      expect(record.dailyReportId).not.toBeNull();
      expect(record.dailyReportId).not.toBeUndefined();

      expect(record).toHaveProperty('userId');
      expect(record.userId).not.toBeNull();
      expect(record.userId).not.toBeUndefined();

      expect(record).toHaveProperty('reportDate');
      expect(record.reportDate).not.toBeNull();
      expect(record.reportDate).not.toBeUndefined();

      expect(record).toHaveProperty('businessContent');
      expect(record.businessContent).not.toBeNull();
      expect(record.businessContent).not.toBeUndefined();

      expect(record).toHaveProperty('submittedAt');
      expect(record.submittedAt).not.toBeNull();
      expect(record.submittedAt).not.toBeUndefined();
    });

    // (3) すべてのレコードの提出状態が 'submitted' であること
    result.dailyReports.forEach((record: DailyReportForLeaderReview) => {
      if ('submissionStatus' in record) {
        expect(record.submissionStatus).toBe('submitted');
      }
    });

    // (4) totalCount がフィルター条件に合致した全提出済み日報件数と一致すること
    expect(result.totalCount).toBeGreaterThanOrEqual(5);
    expect(result.totalCount).toBe(result.dailyReports.length);

    // (5) pageNumber がデフォルト値の 1 を返すこと
    expect(result.pageNumber).toBe(1);

    // (6) pageSize がデフォルト値の 50 を返すこと
    expect(result.pageSize).toBe(50);

    // (7) retrievedAt が ISO 8601形式の時刻文字列で返されること
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    // ISO 8601 形式チェック（例: 2024-01-15T14:32:45.123Z）
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?([+\-]\d{2}:\d{2})?$/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);
  });
});
