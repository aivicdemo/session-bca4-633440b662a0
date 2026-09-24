import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

// テスト対象: SCEN-732
// チームメンバーIDが空のとき、InvalidSchedulerConfigurationError が発生する
// 注: 入力型に teamMemberId フィールドが無いため、仕様とのギャップあり

describe('SCEN-732: スケジューラ設定が無効なときエラーが発生', () => {
  it('scheduledExecutionTime が空または不正な形式のとき、InvalidSchedulerConfigurationError をスロー', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => judgeSchedulerExecutionTiming(input)).toThrow(InvalidSchedulerConfigurationError);
  });
});
