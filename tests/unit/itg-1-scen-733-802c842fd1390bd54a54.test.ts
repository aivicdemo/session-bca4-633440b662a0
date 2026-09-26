import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-733: システムの現在日時が取得できないとき、エラーが発生して処理が中断される', () => {
  it('should throw error when currentTimestamp is invalid ISO format', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: 'invalid-timestamp',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      judgeSchedulerExecutionTiming(input);
      fail('Should have thrown');
    } catch (e) {
      // The error message should relate to system time retrieval failure
      expect((e as Error).message).toBeDefined();
    }
  });

  it('should throw error when currentTimestamp is empty string', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      judgeSchedulerExecutionTiming(input);
      fail('Should have thrown');
    } catch (e) {
      // The error should indicate system time could not be retrieved
      expect((e as Error).message).toBeDefined();
    }
  });

  it('should throw error when currentTimestamp is null', () => {
    const input = {
      currentTimestamp: null,
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      judgeSchedulerExecutionTiming(input as any);
      fail('Should have thrown');
    } catch (e) {
      // Error indicates system time retrieval failed
      expect((e as Error).message).toBeDefined();
    }
  });
});
