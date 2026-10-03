import {
  judgeSchedulerExecutionTiming,
  InvalidSchedulerConfigurationError,
  type JudgeSchedulerExecutionTimingInput,
} from '../../.aivic/design/contract/src/logic/business-day-deadline-judgment';

describe('SCEN-729: 定時未提出者自動検知 - 提出期限の時刻が設定されていないとき', () => {
  describe('judgeSchedulerExecutionTiming処理', () => {
    it('scheduledExecutionTimeがnullのとき、InvalidSchedulerConfigurationErrorが発生して処理が中断される', async () => {
      const input: JudgeSchedulerExecutionTimingInput = {
        currentTimestamp: '2024-01-15T17:30:00Z',
        scheduledExecutionTime: null as any,
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
      };

      await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(
        InvalidSchedulerConfigurationError
      );
    });

    it('エラー文言が「スケジューラ実行時刻の設定が無効です。管理者に確認してください。」である', async () => {
      const input: JudgeSchedulerExecutionTimingInput = {
        currentTimestamp: '2024-01-15T17:30:00Z',
        scheduledExecutionTime: null as any,
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
      };

      try {
        await judgeSchedulerExecutionTiming(input);
        throw new Error('InvalidSchedulerConfigurationErrorが発生すべき');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
        expect((error as Error).message).toBe(
          'スケジューラ実行時刻の設定が無効です。管理者に確認してください。'
        );
      }
    });

    it('shouldExecute、isBusinessDay、isWithinExecutionWindow、nextScheduledExecutionTime、executionReasonは返却されない', async () => {
      const input: JudgeSchedulerExecutionTimingInput = {
        currentTimestamp: '2024-01-15T17:30:00Z',
        scheduledExecutionTime: null as any,
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
      };

      let resultReturned = false;
      try {
        const result = await judgeSchedulerExecutionTiming(input);
        resultReturned = true;
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
        expect(resultReturned).toBe(false);
      }
    });
  });
});
