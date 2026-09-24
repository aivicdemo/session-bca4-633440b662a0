import {
  judgeSchedulerExecutionTiming,
  InvalidSchedulerConfigurationError,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-764: 報告期限時刻が不正な形式のとき、処理が中断され「報告期限時刻は HH:mm 形式で設定してください」が発生する', () => {
  const validCurrentTimestamp = '2024-01-15T17:30:00Z';
  const validTimeZone = 'Asia/Tokyo';
  const validExecutionTimeToleranceMinutes = 5;

  const invalidScheduledExecutionTimes = [
    '25:99',
    '17-30',
    '1730',
    '17:30:00',
  ];

  invalidScheduledExecutionTimes.forEach((invalidTime) => {
    it(`scheduledExecutionTime="${invalidTime}"で、InvalidSchedulerConfigurationErrorが発生する`, async () => {
      await expect(
        judgeSchedulerExecutionTiming({
          currentTimestamp: validCurrentTimestamp,
          scheduledExecutionTime: invalidTime,
          executionTimeToleranceMinutes: validExecutionTimeToleranceMinutes,
          timeZone: validTimeZone,
        })
      ).rejects.toThrow(InvalidSchedulerConfigurationError);
    });

    it(`scheduledExecutionTime="${invalidTime}"で、エラー文言「スケジューラ実行時刻の設定が無効です。管理者に確認してください。」が返される`, async () => {
      try {
        await judgeSchedulerExecutionTiming({
          currentTimestamp: validCurrentTimestamp,
          scheduledExecutionTime: invalidTime,
          executionTimeToleranceMinutes: validExecutionTimeToleranceMinutes,
          timeZone: validTimeZone,
        });
        fail('InvalidSchedulerConfigurationErrorが発生すべき');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
        expect((error as Error).message).toBe(
          'スケジューラ実行時刻の設定が無効です。管理者に確認してください。'
        );
      }
    });
  });

  it('関数は正常系の出力型JudgeSchedulerExecutionTimingOutputを返さない', async () => {
    try {
      await judgeSchedulerExecutionTiming({
        currentTimestamp: validCurrentTimestamp,
        scheduledExecutionTime: '25:99',
        executionTimeToleranceMinutes: validExecutionTimeToleranceMinutes,
        timeZone: validTimeZone,
      });
      fail('InvalidSchedulerConfigurationErrorが発生すべき');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
      // 正常系の出力型が返されていないことを確認
      if (!(error instanceof InvalidSchedulerConfigurationError)) {
        fail('InvalidSchedulerConfigurationError以外のエラーが発生した');
      }
    }
  });
});
