import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// NOTE: aggregateDailyReportStatus は設計書に存在しないため、
// このテストは unresolved 対象です。

describe('SCEN-429: 集計対象日が未来日の場合にエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('集計対象日が未来日の場合にエラーが発生する', async () => {
    // テスト対象の業務ルール br-tx_5-002（aggregateDailyReportStatus）を実行する準備として、
    // reportDate に未来日を指定する。具体的には、本日が 2024-01-15 であると仮定し、
    // reportDate に '2024-01-16' を設定する

    // teamMemberIds に有効なチームメンバーID一覧を設定する（例：['user001', 'user002', 'user003']）
    // submittedReports に当日送信された日報の記録を空配列で設定する（未提出状態を想定）

    // aggregateDailyReportStatus 関数を呼び出す
    // 戻り値またはスロー例外を検証する

    // NOTE: aggregateDailyReportStatus関数は設計書に見つかりませんでした。
    // 実装時に該当する関数の提供が必要です。

    // InvalidReportDateError（エラー名）が発生し、
    // エラー文言として「集計対象日は本日以前の日付を指定してください」が返される。
    // 関数は正常系の出力型を返さず、例外をスロー状態で終了する

    // 予期される動作：
    // - aggregateDailyReportStatus({reportDate: '2024-01-16', ...}) を呼び出し
    // - InvalidReportDateError がスロー
    // - エラーメッセージ: "集計対象日は本日以前の日付を指定してください"

    expect(true).toBe(true);
  });
});
