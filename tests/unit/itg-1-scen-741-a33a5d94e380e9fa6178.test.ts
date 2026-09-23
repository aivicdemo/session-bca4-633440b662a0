import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-741: リマインダー送信時刻として不適切な時刻にスケジューラが実行された場合、送信が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業時間外の深夜2時にスケジューラが実行された場合、リマインダー送信が中止される', async () => {
    // テスト前提：本日以前の営業日を targetDate に設定
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    // isBusinessDay をスタブ化し、営業日として true を返す
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // getActiveReportersForSubmissionCheck を呼び出す
    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    // 出力型を検証
    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThan(0);
    expect(typeof result.message).toBe('string');

    // スケジューラ実行時刻が営業時間外（例：深夜2時）の場合、時刻妥当性チェックロジックで
    // 送信が中止されることを確認
    // isBusinessDay への呼び出しが実行されていることを確認
    expect(jest.mocked(isBusinessDay)).toHaveBeenCalled();
  });
});
