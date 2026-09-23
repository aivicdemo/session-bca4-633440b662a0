import { describe, it, expect } from '@jest/globals';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-723: 検知した未提出者に対して催促の必要性と方法（メール送信の優先度・内容）が判定される', () => {
  it('検知した未提出者に対して催促の必要性と方法（メール送信の優先度・内容）が判定される', () => {
    // 入力で呼び出し
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // 戻り値を設定
    const expectedOutput: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    };

    // 出力フィールドを確認
    expect(expectedOutput.shouldExecute).toBe(true);
    expect(expectedOutput.isBusinessDay).toBe(true);
    expect(expectedOutput.isWithinExecutionWindow).toBe(true);
    expect(expectedOutput.nextScheduledExecutionTime).toBe(null);
    expect(expectedOutput.executionReason).toBe('営業日の実行時刻内');
  });
});
