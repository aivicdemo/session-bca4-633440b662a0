import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  NonBusinessDayError,
  isBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-188: 営業日ではないとき、非営業日エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('非営業日の場合、NonBusinessDayError を発生させる', async () => {
    jest.mocked(isBusinessDay).mockResolvedValue({
      targetDate: '2024-01-13',
      isBusinessDay: false,
      timeZone: 'Asia/Tokyo',
    } as any);

    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-13T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(NonBusinessDayError);
    try {
      await judgeSchedulerExecutionTiming(input);
      fail('NonBusinessDayError should be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NonBusinessDayError);
      expect((error as NonBusinessDayError).message).toBe(
        '本日は営業日ではないため、スケジューラは実行されません。'
      );
    }
  });
});
