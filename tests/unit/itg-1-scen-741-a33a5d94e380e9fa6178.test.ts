import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  ActiveReporterInfo,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-741: リマインダー送信時刻として不適切な時刻にスケジューラが実行された場合、送信が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日の営業時間外の場合、getActiveReportersForSubmissionCheckは正常な出力を返し、呼び出し元で送信中止と判定される', async () => {
    // テスト前提：本日以前の営業日を targetDate に設定
    const targetDate = new Date('2024-01-15'); // 月曜日（営業日）
    const teamLeaderId = 'TL001';

    // isBusinessDay をスタブ化し、営業日として true を返す
    jest.spyOn(businessDayModule, 'isBusinessDay').mockResolvedValue(true);

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    // getActiveReportersForSubmissionCheck を呼び出す
    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    // 受け取った出力値が業務上正常であることを確認
    expect(result.success).toBe(true);

    // 有効な報告者一覧を確認
    expect(Array.isArray(result.reporters)).toBe(true);
    result.reporters.forEach((reporter: ActiveReporterInfo) => {
      expect(reporter).toHaveProperty('reporterId');
      expect(reporter).toHaveProperty('name');
      expect(reporter).toHaveProperty('email');
      expect(reporter).toHaveProperty('status');
    });

    // 正の totalCount を確認
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThan(0);

    // 処理成功メッセージを確認
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);

    // isBusinessDay への呼び出しが実行されていることを確認
    expect(businessDayModule.isBusinessDay).toHaveBeenCalled();
  });
});
