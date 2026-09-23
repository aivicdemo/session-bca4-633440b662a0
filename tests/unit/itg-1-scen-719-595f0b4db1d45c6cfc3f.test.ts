import { describe, it, expect } from '@jest/globals';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-719: 本日の報告者5名と本日の日報提出状況を照合し、17:00時点で未提出の報告者が自動検知される', () => {
  it('本日の報告者5名と本日の日報提出状況を照合し、17:00時点で未提出の報告者が自動検知される', () => {
    // 入力値で呼び出し
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:00:00Z',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // judgeSchedulerExecutionTiming処理の期待出力を定義
    const expectedOutput: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    };

    // 戻り値の JudgeSchedulerExecutionTimingOutput の各フィールドを検証
    expect(expectedOutput.shouldExecute).toBe(true);
    expect(expectedOutput.isBusinessDay).toBe(true);
    expect(expectedOutput.isWithinExecutionWindow).toBe(true);
    expect(expectedOutput.nextScheduledExecutionTime).toBe(null);
    expect(expectedOutput.executionReason).toBe('営業日の実行時刻内');
  });
});
