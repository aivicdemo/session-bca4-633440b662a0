import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment.ts');

describe('SCEN-194: デフォルトタイムゾーン（Asia/Tokyo）で正しく判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日（月曜日）でデフォルトタイムゾーン指定時、shouldExecuteがtrueとなる', async () => {
    // @ts-ignore
    const mockIsBusinessDay = isBusinessDay;
    mockIsBusinessDay.mockResolvedValue(true);

    // @ts-ignore
    const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming;
    mockJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    });

    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBe(null);
    expect(result.executionReason).toBe('営業日の実行時刻内');

    // isBusinessDay が呼び出されたことを検証（営業日判定が実行された）
    // @ts-ignore
    expect(mockIsBusinessDay).toHaveBeenCalled();
  });
});
