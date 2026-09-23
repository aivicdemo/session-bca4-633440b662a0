import { describe, it, expect } from '@jest/globals';
import { deactivateReporterInMaster, ReporterNotFoundError } from '../../src/logic/user-master-persistence';

describe('SCEN-466: 指定された報告者IDがマスタに存在しないため無効化が失敗する', () => {
  it('マスタに存在しない報告者IDを指定した場合、ReporterNotFoundErrorが発生する', async () => {
    // 入力値：
    // - reporterId に『マスタに存在しないID（例：non-existent-reporter-999）』を指定
    // - leaderUserId に有効なチームリーダーID
    // - deactivationTimestamp に現在の日時
    // - deactivationReason に『テスト用理由』を指定
    const reporterId = 'non-existent-reporter-999';
    const leaderUserId = 'leader-001';
    const deactivationTimestamp = new Date();
    const deactivationReason = 'テスト用理由';

    // 期待結果：
    // ReporterNotFoundError 例外が発生し、エラー文言『指定された報告者が見つかりません。』を含む。
    // 出力型 DeactivateReporterInMasterOutput は返却されない。
    // 報告者マスタと変更履歴テーブルは更新されていない状態のままである。
    try {
      await deactivateReporterInMaster({
        reporterId,
        leaderUserId,
        deactivationTimestamp,
        deactivationReason,
      });
      // エラーが発生しない場合はテスト失敗
      throw new Error('ReporterNotFoundErrorが発生すべきですが、発生しませんでした。');
    } catch (error) {
      // エラーが ReporterNotFoundError であることを確認
      if (!(error instanceof ReporterNotFoundError)) {
        throw error;
      }
      // エラー文言が期待値『指定された報告者が見つかりません。』を含むことを確認
      expect(error.message).toContain('指定された報告者が見つかりません。');
    }
  });
});
