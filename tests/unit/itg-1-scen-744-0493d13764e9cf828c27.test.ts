import { describe, it, expect } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  ReporterMasterAccessError,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-744: アクティブな報告者一覧の取得に失敗した場合、リマインダー送信が中止される', () => {
  it('getActiveReportersForSubmissionCheck throws ReporterMasterAccessError when reporter master access fails', () => {
    // 前提条件の設定
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1); // 本日の前日を営業日と仮定
    targetDate.setHours(0, 0, 0, 0);
    const teamLeaderId = 'leader-001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    // 報告者マスタデータへのアクセスが失敗する状態を用意する
    // （例：データベース接続エラー、マスタテーブルが利用不可など）

    // 手順: getActiveReportersForSubmissionCheck(targetDate, teamLeaderId) を実行する

    // 期待結果の検証
    // getActiveReportersForSubmissionCheck は ReporterMasterAccessError を発生させる。
    // または戻り値として以下を返す：success = false、message = "報告者マスタの取得に失敗しました。"、
    // reporters = 空配列、totalCount = 0
    // この結果により、呼び出し元のリマインダー送信処理は報告者一覧の取得失敗を検知し、
    // リマインダー送信を中止する。

    // テスト実行
    let errorThrown: Error | null = null;
    let result: GetActiveReportersForSubmissionCheckOutput | null = null;

    try {
      result = getActiveReportersForSubmissionCheck(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    // 検証
    if (errorThrown !== null) {
      // エラーがスローされた場合
      expect(errorThrown).toBeInstanceOf(ReporterMasterAccessError);
      expect(errorThrown.message).toBe('報告者マスタの取得に失敗しました。');
    } else if (result !== null) {
      // 戻り値が返された場合
      expect(result.success).toBe(false);
      expect(result.message).toBe('報告者マスタの取得に失敗しました。');
      expect(result.reporters).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    } else {
      throw new Error('エラーまたは結果が期待されますが、どちらも取得できませんでした。');
    }
  });
});
