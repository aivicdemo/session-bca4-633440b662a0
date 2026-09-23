import { judgeSchedulerExecutionTiming, InvalidCurrentTimestampError } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual('../../src/logic/business-day-deadline-judgment'),
  isBusinessDay: jest.fn(),
}));

describe('SCEN-189: 現在時刻がISO 8601形式でないとき、タイムスタンプ形式エラーが発生する', () => {
  beforeEach(() => {
    const { isBusinessDay } = require('../../src/logic/business-day-deadline-judgment');
    isBusinessDay.mockReturnValue(true);
  });

  it('ISO 8601形式でない現在時刻を入力したとき、InvalidCurrentTimestampErrorが発生し、エラーメッセージが正確である', () => {
    expect(() =>
      judgeSchedulerExecutionTiming({
        currentTimestamp: '2024-01-15 17:30:00',
        scheduledExecutionTime: '17:30',
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
      })
    ).toThrow(InvalidCurrentTimestampError);

    try {
      judgeSchedulerExecutionTiming({
        currentTimestamp: '2024-01-15 17:30:00',
        scheduledExecutionTime: '17:30',
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
      });
      fail('InvalidCurrentTimestampError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCurrentTimestampError);
      expect((error as InvalidCurrentTimestampError).message).toBe('現在時刻の形式が不正です。');
    }
  });
});
