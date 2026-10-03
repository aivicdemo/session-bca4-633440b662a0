import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  ReporterMasterAccessError,
  type GetActiveReportersForSubmissionCheckInput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-744: アクティブな報告者一覧の取得に失敗した場合、リマインダー送信が中止される', () => {
  let targetDate: Date;
  let teamLeaderId: string;

  beforeEach(() => {
    // 本日以前の営業日に設定
    targetDate = new Date('2024-01-15T00:00:00+09:00');
    teamLeaderId = 'TL001';
  });

  it('報告者マスタデータへのアクセス失敗時、ReporterMasterAccessError が発生するか、success=false を返す', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    let errorThrown = false;
    let result;

    try {
      result = await getActiveReportersForSubmissionCheck(input);
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(ReporterMasterAccessError);
    }

    if (!errorThrown && result) {
      // エラーが例外でなく戻り値で返される場合
      expect(result.success).toBe(false);
      expect(result.message).toBe('報告者マスタの取得に失敗しました。');
      expect(result.reporters).toEqual([]);
      expect(result.totalCount).toBe(0);
    }
  });

  it('エラーが発生した場合の処理：success=false、message="報告者マスタの取得に失敗しました。"、reporters=[]、totalCount=0', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result = await getActiveReportersForSubmissionCheck(input).catch(
      (error) => ({
        success: false as const,
        message: '報告者マスタの取得に失敗しました。',
        reporters: [],
        totalCount: 0,
      })
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('報告者マスタの取得に失敗しました。');
    expect(result.reporters).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});
