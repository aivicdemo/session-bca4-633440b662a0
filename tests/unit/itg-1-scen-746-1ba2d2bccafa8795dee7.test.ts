import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  NoActiveReportersError,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-746: リマインダー送信対象が0人の場合、送信処理がスキップされ検知ログのみ記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効な報告者が存在しない場合、NoActiveReportersErrorが発生する', async () => {
    // テスト前提：営業日かつ本日以前の日付を設定
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    // isBusinessDay をスタブ化し、営業日として true を返す
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    try {
      await getActiveReportersForSubmissionCheck({
        targetDate,
        teamLeaderId,
      });
      throw new Error('NoActiveReportersError が発生すべきですが、発生しませんでした。');
    } catch (error) {
      // NoActiveReportersError が発生することを確認
      if (!(error instanceof NoActiveReportersError)) {
        throw error;
      }

      // エラー文言が「指定日付に日報提出対象の有効な報告者が存在しません。」であることを確認
      expect(error.message).toBe(
        '指定日付に日報提出対象の有効な報告者が存在しません。'
      );

      // この場合、リマインダーメール送信処理は実行されず、検知ログのみがシステムに記録される
      // （エラー発生時のログ記録は呼び出し元の責務）
    }
  });
});
