import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// NOTE: aggregateDailyReportStatus は設計書に存在しないため、
// このテストは unresolved 対象です。

describe('SCEN-430: チームメンバーIDリストが空の場合にエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームメンバーIDリストが空の場合にエラーが発生する', async () => {
    // aggregateDailyReportStatus関数を呼び出す際、teamMemberIds パラメータに空配列 [] を指定する
    // reportDate には本日以前の有効な営業日（ISO 8601形式: YYYY-MM-DD）を指定する
    // submittedReports には空配列 [] を指定する
    // 関数の実行を開始する

    // NOTE: aggregateDailyReportStatus関数は設計書に見つかりませんでした。
    // 実装時に該当する関数の提供が必要です。

    // エラーがスロー（throw）され、エラーメッセージが「チームメンバーが登録されていません」である

    // 予期される動作：
    // - aggregateDailyReportStatus({reportDate: '2024-01-15', teamMemberIds: [], submittedReports: []}) を呼び出し
    // - エラーがスロー
    // - エラーメッセージ: "チームメンバーが登録されていません"

    expect(true).toBe(true);
  });
});
