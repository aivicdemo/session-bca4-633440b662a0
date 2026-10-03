import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-717: 営業日判定で営業日でない日付（土日祝日）の場合、スケジューラ実行後の以降の処理が実行されない', () => {
  it('営業日ではない日付の場合、スケジューラが実行されない', async () => {
    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-13T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    });

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).not.toBeNull();
    expect(result.nextScheduledExecutionTime).toMatch(/2024-01-15T17:30:00Z/);
    expect(result.executionReason).toBe('営業日ではない');
  });
});
