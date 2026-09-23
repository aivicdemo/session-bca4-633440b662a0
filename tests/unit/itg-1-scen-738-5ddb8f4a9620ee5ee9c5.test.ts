import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
  isBusinessDay as realIsBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

const mockIsBusinessDay = jest.fn();

describe('SCEN-738: 報告者5名のうち1名だけが17:00までに日報を提出した場合、4名が未提出者として検知される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockIsBusinessDay as any).mockResolvedValue(true);
  });

  it('定時スケジューラが17:00に自動実行されたとき、実行判定が正常に返される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:00:00+09:00',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: ['M001', 'M002', 'M003', 'M004', 'M005'],
      leaderEmail: 'leader@example.com',
    };

    // @ts-ignore
    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
  });

  it('実行判定の結果がすべての期待条件を満たす', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:00:00+09:00',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: ['M001', 'M002', 'M003', 'M004', 'M005'],
      leaderEmail: 'leader@example.com',
    };

    // @ts-ignore
    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result).toHaveProperty('shouldExecute', true);
    expect(result).toHaveProperty('isBusinessDay', true);
    expect(result).toHaveProperty('isWithinExecutionWindow', true);
    expect(result).toHaveProperty('nextScheduledExecutionTime', null);
    expect(result).toHaveProperty('executionReason');
    expect(typeof result.executionReason).toBe('string');
  });

  it('営業日かつ実行時刻内である文言がexecutionReasonに含まれる', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:00:00+09:00',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: ['M001', 'M002', 'M003', 'M004', 'M005'],
      leaderEmail: 'leader@example.com',
    };

    // @ts-ignore
    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.executionReason).toMatch(/営業日/);
    expect(result.executionReason).toMatch(/実行時刻内/);
  });
});
