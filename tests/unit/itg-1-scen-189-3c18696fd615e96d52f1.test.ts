import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  InvalidCurrentTimestampError,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-189: 現在時刻がISO 8601形式でないとき、タイムスタンプ形式エラーが発生する', () => {
  test('currentTimestampパラメータに「2024-01-15 17:30:00」（ISO 8601形式ではない任意の文字列）を設定した場合、InvalidCurrentTimestampErrorが発生し、エラーメッセージが「現在時刻の形式が不正です。」である', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15 17:30:00',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => {
      judgeSchedulerExecutionTiming(input);
    }).toThrow(InvalidCurrentTimestampError);

    try {
      judgeSchedulerExecutionTiming(input);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCurrentTimestampError);
      expect((error as Error).message).toBe('現在時刻の形式が不正です。');
    }
  });
});
