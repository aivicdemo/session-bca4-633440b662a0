import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { deactivateReporterInMaster, ReporterAlreadyInactiveError, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

describe('SCEN-467: 指定された報告者が既に無効化されているため操作が拒否される', () => {
  // テスト前提：persistReporterMasterChangeHistory 処理をスタブ化
  beforeEach(() => {
    jest.mocked(persistReporterMasterChangeHistory).mockResolvedValue({});
  });

  it('既に無効化されている報告者を無効化しようとした場合、ReporterAlreadyInactiveErrorが発生する', async () => {
    // テスト前提条件：報告者マスタに reporterId='R001' で既に無効化済み（status='inactive'）の報告者レコードが存在
    // 入力値：
    // - reporterId: 'R001'（既に無効化されている報告者ID）
    // - leaderUserId: 'L001'（チームリーダーのユーザーID）
    // - deactivationTimestamp: 現在の Date オブジェクト
    // - deactivationReason: '異動'
    const reporterId = 'R001';
    const leaderUserId = 'L001';
    const deactivationTimestamp = new Date();
    const deactivationReason = '異動';

    // 期待動作：ReporterAlreadyInactiveError が発生し、エラー文言が『この報告者は既に無効化されています。』であること
    try {
      await deactivateReporterInMaster({
        reporterId,
        leaderUserId,
        deactivationTimestamp,
        deactivationReason,
      });
      // エラーが発生しない場合はテスト失敗
      throw new Error('ReporterAlreadyInactiveErrorが発生すべきですが、発生しませんでした。');
    } catch (error) {
      // エラーが ReporterAlreadyInactiveError であることを確認
      if (!(error instanceof ReporterAlreadyInactiveError)) {
        throw error;
      }
      // エラー文言が期待値『この報告者は既に無効化されています。』であることを確認
      expect(error.message).toBe('この報告者は既に無効化されています。');
      // 戻り値の出力型 DeactivateReporterInMasterOutput は返されず、処理は中断されることを確認
      // 報告者マスタおよび変更履歴の更新は行われない
      expect(jest.mocked(persistReporterMasterChangeHistory)).not.toHaveBeenCalled();
    }
  });
});
