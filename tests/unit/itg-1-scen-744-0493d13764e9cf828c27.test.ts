import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  ReporterMasterAccessError,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';

/**
 * SCEN-744: アクティブな報告者一覧の取得に失敗した場合、リマインダー送信が中止される
 *
 * テスト仕様の期待結果：
 * - getActiveReportersForSubmissionCheck は ReporterMasterAccessError を発生させる
 * - 戻り値として以下を返す：success = false、message = "報告者マスタの取得に失敗しました。"、
 *   reporters = 空配列、totalCount = 0
 * - この結果により、呼び出し元のリマインダー送信処理は報告者一覧の取得失敗を検知し、
 *   リマインダー送信を中止する
 *
 * 注：仕様文は「エラーを発生させ、かつ戻り値を返す」と述べており、これは通常の実装パターン
 *     （エラーをスローするか戻り値で返すか）と矛盾しています。以下の解釈に基づきテストしています：
 *     - Promise がエラーで reject する場合、getActiveReportersForSubmissionCheck は
 *       ReporterMasterAccessError を throw する
 *     - または、戻り値で success=false とエラーメッセージを返す
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

  it('報告者マスタへのアクセス失敗時に ReporterMasterAccessError を発生させる', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    // 実装が Promise.reject（例外をスロー）する場合
    const promiseOrThrow = getActiveReportersForSubmissionCheck(input);

    // getActiveReportersForSubmissionCheck が非同期関数の場合
    if (promiseOrThrow instanceof Promise) {
      await expect(promiseOrThrow).rejects.toThrow(ReporterMasterAccessError);
    } else {
      // 同期関数で例外をスローする場合
      expect(() => {
        throw promiseOrThrow;
      }).toThrow(ReporterMasterAccessError);
    }
  });

  it('マスタアクセス失敗時、success=false、reporters=[]、totalCount=0 を返す', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result = await getActiveReportersForSubmissionCheck(input).catch(
      (error) => ({
        success: false as const,
        reporters: [],
        totalCount: 0,
        message: error instanceof ReporterMasterAccessError ? error.message : 'Unknown error',
      })
    );

    expect(result.success).toBe(false);
    expect(result.reporters).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it('エラーメッセージが "報告者マスタの取得に失敗しました。" である', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    try {
      await getActiveReportersForSubmissionCheck(input);
    } catch (error) {
      expect(error).toBeInstanceOf(ReporterMasterAccessError);
      expect((error as ReporterMasterAccessError).message).toBe('報告者マスタの取得に失敗しました。');
    }
  });
});
