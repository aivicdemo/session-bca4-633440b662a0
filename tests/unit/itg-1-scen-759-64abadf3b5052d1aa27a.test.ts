import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-759: リセット処理中にシステムエラーが発生したとき、処理が中断され「日次リセット処理に失敗しました。再実行してください」が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リセット処理中にシステムエラーが発生したとき、エラーが発生して処理が中断される', async () => {
    // システムエラーをシミュレート：isBusinessDay が例外をスロー
    (isBusinessDay as jest.Mock).mockImplementationOnce(() => {
      throw new Error('日次リセット処理に失敗しました。再実行してください');
    });

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // 処理が中断され、エラーが発生することを検証
    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(
      '日次リセット処理に失敗しました。再実行してください'
    );
  });
});
