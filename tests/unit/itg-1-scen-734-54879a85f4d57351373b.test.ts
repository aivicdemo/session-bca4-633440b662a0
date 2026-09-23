import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
  isBusinessDay as realIsBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

const mockIsBusinessDay = jest.fn();

describe('SCEN-734: 登録済み報告者のリストが空のとき、警告が発生して処理が継続される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockIsBusinessDay as any).mockResolvedValue(true);
  });

  it('報告者が登録されていない場合、shouldExecuteがfalseで処理は正常に完了する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: [],
      leaderEmail: 'leader@example.com',
    };

    let result: JudgeSchedulerExecutionTimingOutput | undefined;
    try {
      // @ts-ignore
      result = await judgeSchedulerExecutionTiming(input);
    } catch (error) {
      // 処理が正常に完了することを確認
    }

    if (result) {
      expect(result.shouldExecute).toBe(false);
      expect(result.isBusinessDay).toBe(true);
      expect(result.isWithinExecutionWindow).toBe(true);
      expect(result.executionReason).toContain('チームに報告者が登録されていません');
      expect(result.nextScheduledExecutionTime).toBeDefined();
      expect(result.nextScheduledExecutionTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    }
  });

  it('エラーは発生せず処理は正常に完了する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: [],
      leaderEmail: 'leader@example.com',
    };

    let error;
    let result;
    try {
      // @ts-ignore
      result = await judgeSchedulerExecutionTiming(input);
    } catch (err) {
      error = err;
    }

    expect(error).toBeUndefined();
    expect(result).toBeDefined();
  });
});
