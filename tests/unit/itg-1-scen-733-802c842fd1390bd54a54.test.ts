import { judgeSchedulerExecutionTiming, InvalidCurrentTimestampError } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-733: システムの現在日時が不正な形式のとき、エラーが発生して処理が中断される', () => {
  it('currentTimestampが無効なISO 8601形式の場合、InvalidCurrentTimestampErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: 'invalid-timestamp',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidCurrentTimestampError);
  });

  it('別の無効なタイムスタンプ形式でもエラーが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: 'not-a-date',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidCurrentTimestampError);
  });

  it('エラー時に処理は中断される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: 'invalid-timestamp',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      await judgeSchedulerExecutionTiming(input);
      fail('InvalidCurrentTimestampErrorが発生すべき');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCurrentTimestampError);
    }
  });
});
