import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual('../../src/logic/business-day-deadline-judgment'),
  isBusinessDay: jest.fn().mockReturnValue(true),
}));

describe('SCEN-754: 前日に日報を提出しなかった報告者が未提出者として正しく特定され、リセット結果に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日の定時実行時刻で未提出者検知処理が実行対象となることを判定', () => {
    const result = judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
