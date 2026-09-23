import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  InvalidSchedulerConfigurationError,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
  isBusinessDay as realIsBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

const mockIsBusinessDay = jest.fn();

describe('SCEN-731: 提出期限時刻の形式が不正なとき、エラーが発生して処理が中断される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockIsBusinessDay as any).mockResolvedValue(true);
  });

  it('テストケース1: 実行予定時刻が25:00のとき、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '25:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: ['M001'],
      leaderEmail: 'leader@example.com',
    };

    // @ts-ignore
    const fn = () => judgeSchedulerExecutionTiming(input);
    await expect(fn).rejects.toThrow(InvalidSchedulerConfigurationError);
  });

  it('テストケース2: 実行予定時刻がabc:00のとき、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: 'abc:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: ['M001'],
      leaderEmail: 'leader@example.com',
    };

    // @ts-ignore
    const fn = () => judgeSchedulerExecutionTiming(input);
    await expect(fn).rejects.toThrow(InvalidSchedulerConfigurationError);
  });

  it('エラー文言が正確であること', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '25:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: ['M001'],
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
});
