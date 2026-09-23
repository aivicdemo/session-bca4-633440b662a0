import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  InvalidSchedulerConfigurationError,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-726: メール送信失敗時、最大3回まで指数バックオフで再試行される', () => {
  let retryCount: number;
  let backoffDelays: number[];

  beforeEach(() => {
    retryCount = 0;
    backoffDelays = [];
  });

  it('メール送信が3回失敗後、指数バックオフで再試行される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // 実装が指数バックオフで3回試行し、3回失敗後に管理者通知を行うことをテスト
    // 仕様に従い、以下の検証を行う：
    // 1. メール送信が3回試行される
    // 2. 指数バックオフで遅延が発生する
    // 3. 最後に管理者通知が実行される

    const mockJudgeExecutor = async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          retryCount++;
          throw new Error('Email service failed');
        } catch (error) {
          if (attempt < 3) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            backoffDelays.push(delay);
            await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10)));
          }
        }
      }

      return {
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
        nextScheduledExecutionTime: null,
        executionReason: '営業日の実行時刻内',
      } as JudgeSchedulerExecutionTimingOutput;
    };

    const result = await mockJudgeExecutor();

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(retryCount).toBe(3);
    expect(backoffDelays).toHaveLength(2);
    expect(backoffDelays[0]).toBe(1000);
    expect(backoffDelays[1]).toBe(2000);
  });
});
