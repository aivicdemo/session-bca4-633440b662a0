import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  NonBusinessDayError,
} from '../../src/logic/business-day-deadline-judgment';
import type {
  JudgeSchedulerExecutionTimingInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-188: 営業日ではないとき、非営業日エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日ではないとき、NonBusinessDayError が発生し、エラー文言は「本日は営業日ではないため、スケジューラは実行されません。」である', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-13T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      await judgeSchedulerExecutionTiming(input);
      fail('NonBusinessDayError should be thrown');
    } catch (error) {
      if (error instanceof NonBusinessDayError) {
        expect(error.message).toBe('本日は営業日ではないため、スケジューラは実行されません。');
      } else {
        throw error;
      }
    }
  });
});
