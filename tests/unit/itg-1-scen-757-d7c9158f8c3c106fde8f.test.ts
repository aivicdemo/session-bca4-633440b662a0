import { describe, it, expect } from '@jest/globals';
import { judgeSchedulerExecutionTiming, InvalidCurrentTimestampError } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-757: チームメンバーIDが空のとき、処理が中断され「チームメンバー情報が不正です。管理者に確認してください」が発生する', () => {
  it('currentTimestampフィールドに空文字列を設定すると、InvalidCurrentTimestampErrorが発生する', async () => {
    const input = {
      currentTimestamp: '',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidCurrentTimestampError);
    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow('現在時刻の形式が不正です。');
  });
});
