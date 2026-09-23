import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-761: 日報提出期限17:00に達したとき、5名の報告者のうち期限までに提出しなかった者が未提出者として検知される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('月曜日 2024-01-15 の17:00にスケジューラが実行されるとき、shouldExecute が true となる', async () => {
    // isBusinessDay を営業日（月曜日 2024-01-15）を返すようスタブ設定
    jest.mocked(isBusinessDay).mockReturnValue(true);

    const input = {
      currentTimestamp: '2024-01-15T17:00:00Z',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 出力の各フィールドを検証
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toContain('営業日の実行時刻内');
  });
});
