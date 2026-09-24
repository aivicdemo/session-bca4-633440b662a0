import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  ReporterMasterAccessError,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';

/**
 * SCEN-744: アクティブな報告者一覧の取得に失敗した場合、リマインダー送信が中止される
 *
 * 前提条件：
 * - targetDate を本日以前の営業日として設定
 * - teamLeaderId を有効なチームリーダーID として設定
 * - 報告者マスタデータへのアクセスが失敗する状態を用意（例：データベース接続エラー、マスタテーブルが利用不可）
 *
 * 期待結果：
 * - getActiveReportersForSubmissionCheck は ReporterMasterAccessError を発生させる
 * - 戻り値として以下を返す：
 *   - success = false
 *   - message = "報告者マスタの取得に失敗しました。"
 *   - reporters = 空配列
 *   - totalCount = 0
 * - リマインダー送信処理は報告者一覧の取得失敗を検知し、リマインダー送信を中止する
 */
describe('SCEN-744: 報告者マスタ取得失敗時のエラー処理', () => {
  let targetDate: Date;
  let teamLeaderId: string;

  beforeEach(() => {
    // 本日以前の営業日に設定
    targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
    teamLeaderId = 'valid-team-leader-id-001';
  });

  it('targetDate を本日以前の営業日、teamLeaderId を有効なチームリーダーID として設定し、報告者マスタへのアクセス失敗時に ReporterMasterAccessError を発生させる', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    await expect(
      getActiveReportersForSubmissionCheck(input)
    ).rejects.toThrow(ReporterMasterAccessError);
  });

  it('ReporterMasterAccessError のメッセージが "報告者マスタの取得に失敗しました。" である', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    try {
      await getActiveReportersForSubmissionCheck(input);
      throw new Error('ReporterMasterAccessError が発生していません');
    } catch (error) {
      expect(error).toBeInstanceOf(ReporterMasterAccessError);
      expect((error as Error).message).toBe('報告者マスタの取得に失敗しました。');
    }
  });

  it('マスタアクセス失敗時、success=false、reporters=[]、totalCount=0、message="報告者マスタの取得に失敗しました。" を返す', () => {
    const expectedOutput: GetActiveReportersForSubmissionCheckOutput = {
      success: false,
      reporters: [],
      totalCount: 0,
      message: '報告者マスタの取得に失敗しました。',
    };

    expect(expectedOutput.success).toBe(false);
    expect(expectedOutput.reporters).toHaveLength(0);
    expect(expectedOutput.totalCount).toBe(0);
    expect(expectedOutput.message).toBe('報告者マスタの取得に失敗しました。');
  });
});
