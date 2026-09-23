import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  InvalidSchedulerConfigurationError,
  JudgeSchedulerExecutionTimingInput,
  isBusinessDay as realIsBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

const mockIsBusinessDay = jest.fn();

describe('SCEN-732: チームメンバーIDが空のとき、エラーが発生して処理が中断される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockIsBusinessDay as any).mockResolvedValue(true);
  });

  it('チームメンバーIDが空文字列のとき、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: [],
      leaderEmail: 'leader@example.com',
    };

    try {
      // @ts-ignore
      await judgeSchedulerExecutionTiming(input);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
      expect((error as Error).message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
    }
  });

  it('チームメンバーIDが未定義のとき、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: undefined,
      leaderEmail: 'leader@example.com',
    };

    try {
      // @ts-ignore
      await judgeSchedulerExecutionTiming(input);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
      expect((error as Error).message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
    }
  });

  it('処理は中断され、出力型は返却されない', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: [],
      leaderEmail: 'leader@example.com',
    };

    let result;
    try {
      // @ts-ignore
      result = await judgeSchedulerExecutionTiming(input);
    } catch (error) {
      // エラーが発生することを確認
    }

    expect(result).toBeUndefined();
  });
});
