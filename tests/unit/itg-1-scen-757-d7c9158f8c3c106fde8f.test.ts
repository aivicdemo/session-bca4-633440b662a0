import { judgeSchedulerExecutionTiming, InvalidCurrentTimestampError } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => {
  const actual = jest.requireActual('../../src/logic/business-day-deadline-judgment');
  return {
    ...actual,
    isBusinessDay: jest.fn().mockResolvedValue(true),
  };
});

describe('SCEN-757: currentTimestamp が空文字列のとき', () => {
  it('InvalidCurrentTimestampError エラーが発生し、エラー文言「現在時刻の形式が不正です。」が返される', async () => {
    const input = {
      currentTimestamp: '',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      await judgeSchedulerExecutionTiming(input);
      fail('InvalidCurrentTimestampError が発生するはずです');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCurrentTimestampError);
      expect(error.message).toBe('現在時刻の形式が不正です。');
    }
  });
});
