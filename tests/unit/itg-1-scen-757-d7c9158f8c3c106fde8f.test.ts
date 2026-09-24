import {
  judgeSchedulerExecutionTiming,
  InvalidCurrentTimestampError,
  JudgeSchedulerExecutionTimingInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-757: チームメンバーIDが空のとき、処理が中断され「チームメンバー情報が不正です。管理者に確認してください」が発生する', () => {
  it('currentTimestamp に空文字列を設定して呼び出すと、InvalidCurrentTimestampError が発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // InvalidCurrentTimestampError エラーが発生し、エラー文言「現在時刻の形式が不正です。」が返される
    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidCurrentTimestampError);
    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow('現在時刻の形式が不正です。');
  });
});
