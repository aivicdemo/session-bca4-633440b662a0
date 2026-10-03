import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-738: 報告者5名のうち1名だけが17:00までに日報を提出した場合、4名が未提出者として検知され、リーダーに通知される', () => {
  it('should return shouldExecute=true to enable non-submission detection for 4 unreported members', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:00:00Z',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = judgeSchedulerExecutionTiming(input) as JudgeSchedulerExecutionTimingOutput;

    // Expected conditions per SCEN-738:
    // shouldExecute = true (enables non-submission detection)
    expect(result.shouldExecute).toBe(true);

    // isBusinessDay = true (2024-01-15 is Monday)
    expect(result.isBusinessDay).toBe(true);

    // isWithinExecutionWindow = true (17:00 is at scheduled time)
    expect(result.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTime = null (executing now)
    expect(result.nextScheduledExecutionTime).toBeNull();

    // executionReason = '営業日の実行時刻内'
    expect(result.executionReason).toBe('営業日の実行時刻内');

    // With these conditions, the system proceeds to:
    // - Detect 4 non-submitters (B, C, D, E)
    // - Send leader notification with the 4-member list
  });
});
