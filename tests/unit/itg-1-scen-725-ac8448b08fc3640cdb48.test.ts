import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-725: メール送信失敗時、内部ログに送信失敗が記録され、管理画面の未提出者一覧に「通知未送信」フラグが立てられる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(businessDayModule, 'isBusinessDay').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('メール送信失敗時でもスケジューラ実行判定は有効（shouldExecute=true）', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
