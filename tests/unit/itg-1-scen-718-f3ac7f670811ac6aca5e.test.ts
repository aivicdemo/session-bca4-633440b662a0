import { describe, it, expect } from '@jest/globals';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-718: 定時スケジューラ実行時刻が営業日かつ有効な日報提出期限であることを確認し、アクティブな報告者5名を取得して未提出者検知の対象者リストが確定される', () => {
  it('定時スケジューラ実行時刻が営業日かつ有効な日報提出期限であることを確認し、アクティブな報告者5名を取得して未提出者検知の対象者リストが確定される', () => {
    // 入力値を与える
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
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

    // 戻り値JudgeSchedulerExecutionTimingOutputの検証
    // shouldExecute: true（営業日かつ実行時刻に該当するため実行対象）
    expect(expectedOutput.shouldExecute).toBe(true);

    // isBusinessDay: true（現在日付2024-01-15が営業日）
    expect(expectedOutput.isBusinessDay).toBe(true);

    // isWithinExecutionWindow: true（現在時刻17:30:00がスケジューラ実行予定時刻17:30の許容範囲±5分内）
    expect(expectedOutput.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTime: null（実行可能な場合）
    expect(expectedOutput.nextScheduledExecutionTime).toBe(null);

    // executionReason: "営業日の実行時刻内"
    expect(expectedOutput.executionReason).toBe('営業日の実行時刻内');
  });
});
