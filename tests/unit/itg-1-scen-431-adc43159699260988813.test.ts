import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
  DailyReportForLeaderReview,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-431: リーダーが指定期間内の提出済み日報を検索し、日報ID・ユーザーID・報告日・業務内容・提出時刻を含むレコードセットが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リーダーが指定期間内の提出済み日報を検索し、日報ID・ユーザーID・報告日・業務内容・提出時刻を含むレコードセットが返される', async () => {
    // テスト対象の公開処理 retrieveDailyReportsForLeaderReview を呼び出す準備として、
    // リーダーID・検索期間・フィルター条件を含む RetrieveDailyReportsForLeaderReviewInput を組み立てる。

    // リーダーID を 'leader-001' に設定する。
    // 検索対象期間を startDate: '2024-01-01'、endDate: '2024-01-31' に設定する。
    // filterByUserId を undefined（指定なし）に設定する。
    // filterBySubmissionStatus を 'submitted' に設定して提出済み日報のみに絞る。
    // sortBy を undefined（デフォルト報告日の降順）に設定する。
    // pageNumber を 1、pageSize を 50 に設定する。
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

    // 入力パラメータを retrieveDailyReportsForLeaderReview に渡して実行する。
    const output: RetrieveDailyReportsForLeaderReviewOutput = await retrieveDailyReportsForLeaderReview(input);

    // 戻り値の RetrieveDailyReportsForLeaderReviewOutput を検証する。
    expect(output).toBeDefined();

    // dailyReports 配列の各要素が DailyReportForLeaderReview 型として日報ID・ユーザーID・報告日・業務内容・提出時刻のフィールドを含むことを確認する。
    expect(output.dailyReports).toBeDefined();
    expect(Array.isArray(output.dailyReports)).toBe(true);

    // 配列の各要素を検証
    if (output.dailyReports.length > 0) {
      const firstReport: DailyReportForLeaderReview = output.dailyReports[0];
      expect(firstReport).toHaveProperty('dailyReportId');
      expect(firstReport).toHaveProperty('userId');
      expect(firstReport).toHaveProperty('reportDate');
      expect(firstReport).toHaveProperty('businessContent');
      expect(firstReport).toHaveProperty('submittedAt');

      // reportDate は YYYY-MM-DD 形式
      expect(typeof firstReport.reportDate).toBe('string');
      expect(firstReport.reportDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // submittedAt は ISO 8601形式
      expect(typeof firstReport.submittedAt).toBe('string');
      expect(firstReport.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    }

    // totalCount が検索条件に合致した提出済み日報の全件数を示していることを確認する。
    expect(output.totalCount).toBeDefined();
    expect(typeof output.totalCount).toBe('number');
    expect(output.totalCount).toBeGreaterThanOrEqual(0);

    // pageNumber が 1 であることを確認する。
    expect(output.pageNumber).toBe(1);

    // pageSize が 50 であることを確認する。
    expect(output.pageSize).toBe(50);

    // retrievedAt が ISO 8601形式の有効なタイムスタンプであることを確認する。
    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');
    expect(output.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 検索対象期間 2024-01-01 から 2024-01-31 の間に提出済み状態である全日報が返却される。
    // 返却される dailyReports 配列の各レコードは ReadonlyArray<DailyReportForLeaderReview> 型として、
    // 日報ID、ユーザーID、報告日（YYYY-MM-DD形式）、業務内容、提出時刻（ISO 8601形式）のフィールドを含む。
    // totalCount は条件に合致した提出済み日報の総件数を示す。
    // pageNumber は 1、pageSize は 50 である。
    // retrievedAt は処理実行時刻を ISO 8601形式で示す。
  });
});
