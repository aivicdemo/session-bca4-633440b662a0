import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-718: 定時スケジューラ実行時刻が営業日かつ有効な日報提出期限であることを確認し、アクティブな報告者5名を取得して未提出者検知の対象者リストが確定される', () => {
  it('営業日かつ実行時刻に該当する場合、スケジューラが実行対象となる', async () => {
    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    });

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
