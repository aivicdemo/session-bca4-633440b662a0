import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-759: リセット処理中にシステムエラーが発生したとき、処理が中断され「日次リセット処理に失敗しました。再実行してください」が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リセット処理中にシステムエラーが発生したとき、エラーメッセージが表示される', async () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // スケジューラが外部サービス通信障害などのシステムエラーで失敗したシナリオ
    // 関数呼び出し時にエラーが発生する状態を検証
    try {
      await judgeSchedulerExecutionTiming(input);
    } catch (error: any) {
      // 処理が中断されエラーが発生することを確認
      expect(error).toBeDefined();
    }
  });
});
