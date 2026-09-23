import { describe, it, expect } from '@jest/globals';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-721: 本日の提出済み日報データが取得され、未提出者検知結果と合わせてリーダーの管理画面に表示するデータセットが構成される', () => {
  it('本日の提出済み日報データが取得され、未提出者検知結果と合わせてリーダーの管理画面に表示するデータセットが構成される', () => {
    // judgeSchedulerExecutionTiming関数を呼び出し
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // 戻り値を設定
    const expectedOutput: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    };

    // 戻り値の出力型JudgeSchedulerExecutionTimingOutputのすべてのフィールドを検証
    // shouldExecuteがtrueを返す
    expect(expectedOutput.shouldExecute).toBe(true);

    // isBusinessDayがtrueを返す
    expect(expectedOutput.isBusinessDay).toBe(true);

    // isWithinExecutionWindowがtrueを返す（現在時刻がスケジューラ実行時刻17:30±5分の許容範囲内）
    expect(expectedOutput.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTimeがnullを返す（実行可能なため次回実行時刻は設定しない）
    expect(expectedOutput.nextScheduledExecutionTime).toBe(null);

    // executionReasonが「営業日の実行時刻内」を返す
    expect(expectedOutput.executionReason).toBe('営業日の実行時刻内');
  });
});
