import { judgeSchedulerExecutionTiming, NonBusinessDayError } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual('../../src/logic/business-day-deadline-judgment'),
  isBusinessDay: jest.fn(),
}));

describe('SCEN-188: 営業日ではないとき、非営業日エラーが発生する', () => {
  beforeEach(() => {
    const { isBusinessDay } = require('../../src/logic/business-day-deadline-judgment');
    isBusinessDay.mockReturnValue(false);
  });

  it('非営業日のとき、NonBusinessDayErrorが発生し、エラーメッセージが正確である', () => {
    expect(() =>
      judgeSchedulerExecutionTiming({
        currentTimestamp: '2024-01-13T17:30:00Z',
        scheduledExecutionTime: '17:30',
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
      })
    ).toThrow(NonBusinessDayError);

    try {
      judgeSchedulerExecutionTiming({
        currentTimestamp: '2024-01-13T17:30:00Z',
        scheduledExecutionTime: '17:30',
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
      });
      fail('NonBusinessDayError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NonBusinessDayError);
      expect((error as NonBusinessDayError).message).toBe('本日は営業日ではないため、スケジューラは実行されません。');
    }
  });
});
