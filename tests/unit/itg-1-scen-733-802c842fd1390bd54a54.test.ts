import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  isBusinessDay as realIsBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

const mockIsBusinessDay = jest.fn();

describe('SCEN-733: システムの現在日時が取得できないとき、エラーが発生して処理が中断される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockIsBusinessDay as any).mockResolvedValue(true);
  });

  it('currentTimestampが値を設定しないとき、「システム時刻の取得に失敗しました」エラーが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: undefined,
      scheduledExecutionTime: '17:30',
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
      expect((error as Error).message).toContain('システム時刻の取得に失敗しました');
    }
  });

  it('currentTimestampがnullのとき、「システム時刻の取得に失敗しました」エラーが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: null,
      scheduledExecutionTime: '17:30',
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
      expect((error as Error).message).toContain('システム時刻の取得に失敗しました');
    }
  });

  it('処理は中断され、出力型は返却されない', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: null,
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      teamMemberIds: ['M001'],
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
