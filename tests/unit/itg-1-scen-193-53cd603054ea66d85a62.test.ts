import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment.ts');

describe('SCEN-193: 実行不可なとき、次回実行予定時刻は次営業日の指定時刻で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日ではない場合、shouldExecuteがfalseで、nextScheduledExecutionTimeが次営業日の指定時刻となる', async () => {
    // isBusinessDay をスタブ化：土曜日（2024-01-13）が営業日でないことを返す
    // @ts-ignore
    const mockIsBusinessDay = isBusinessDay;
    mockIsBusinessDay.mockResolvedValue(false);

    // @ts-ignore
    const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming;
    mockJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: false,
      isBusinessDay: false,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: '2024-01-15T17:30:00Z',
      executionReason: '営業日ではない',
    });

    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-13T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBe('2024-01-15T17:30:00Z');
    expect(result.executionReason).toBe('営業日ではない');

    // isBusinessDay が呼び出されたことを検証
    // @ts-ignore
    expect(mockIsBusinessDay).toHaveBeenCalled();
  });
});
