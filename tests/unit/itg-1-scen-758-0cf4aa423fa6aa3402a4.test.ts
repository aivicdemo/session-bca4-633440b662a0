import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-758: 前日の日報データが取得できないとき、処理が中断されエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('前日の日報データ取得が失敗するとき、「前日の日報データが読み込めません。システム管理者に連絡してください」エラーが発生する', async () => {
    // 前日の日報データ取得が失敗する状態をモック設定
    (isBusinessDay as jest.Mock).mockImplementationOnce(() => {
      throw new Error('前日の日報データが読み込めません。システム管理者に連絡してください');
    });

    // judgeSchedulerExecutionTiming に入力値を設定して呼び出す
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // 関数の戻り値またはスローされた例外を検証する
    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(
      '前日の日報データが読み込めません。システム管理者に連絡してください'
    );
  });
});
