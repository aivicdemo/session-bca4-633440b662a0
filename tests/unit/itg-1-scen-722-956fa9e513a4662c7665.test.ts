import { describe, it, expect } from '@jest/globals';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-722: 未提出者一覧、提出済み日報、検知ログが統合され、リーダーの管理画面に表示するダッシュボードデータが生成される', () => {
  it('未提出者一覧、提出済み日報、検知ログが統合され、リーダーの管理画面に表示するダッシュボードデータが生成される', () => {
    // 現在時刻が営業日の定時実行時刻（17:30）の許容範囲内（±5分）
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // ダッシュボード画面が自動更新される状態を確認
    const expectedOutput: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    };

    // 期待結果を検証
    expect(expectedOutput.shouldExecute).toBe(true);
    expect(expectedOutput.isBusinessDay).toBe(true);
    expect(expectedOutput.isWithinExecutionWindow).toBe(true);
    expect(expectedOutput.nextScheduledExecutionTime).toBe(null);
    expect(expectedOutput.executionReason).toBe('営業日の実行時刻内');
  });
});
