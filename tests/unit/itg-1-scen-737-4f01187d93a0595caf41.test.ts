import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
  isBusinessDay as realIsBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

const mockIsBusinessDay = jest.fn();

describe('SCEN-737: 報告者5名全員が17:00までに日報を提出した場合、実行判定が確定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockIsBusinessDay as any).mockResolvedValue(true);
  });

  it('現在時刻が営業日の17:00のとき、shouldExecuteがtrueで返される', async () => {
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
    expect(result.executionReason).toMatch(/営業日の実行時刻内/);
  });

  it('実行判定結果がすべての条件を満たす', async () => {
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
});
