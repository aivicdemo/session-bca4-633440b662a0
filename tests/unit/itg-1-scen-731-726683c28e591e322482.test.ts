import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError } from '../../.aivic/design/contract/src/logic/business-day-deadline-judgment';

describe('SCEN-731: 提出期限時刻の形式が不正なとき、InvalidSchedulerConfigurationErrorが発生', () => {
  const currentTimestamp = '2024-01-15T17:30:00Z';
  const executionTimeToleranceMinutes = 5;
  const timeZone = 'Asia/Tokyo';

  describe('テストケース1: 24時間形式の上限を超える時刻（25:00）', () => {
    it('25:00という不正な時刻を設定すると、InvalidSchedulerConfigurationErrorが発生する', async () => {
      const scheduledExecutionTime = '25:00';

      await expect(
        judgeSchedulerExecutionTiming({
          currentTimestamp,
          scheduledExecutionTime,
          executionTimeToleranceMinutes,
          timeZone,
        })
      ).rejects.toThrow(InvalidSchedulerConfigurationError);

      try {
        await judgeSchedulerExecutionTiming({
          currentTimestamp,
          scheduledExecutionTime,
          executionTimeToleranceMinutes,
          timeZone,
        });
      } catch (error) {
        if (error instanceof InvalidSchedulerConfigurationError) {
          expect(error.message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
        }
      }
    });
  });

  describe('テストケース2: 非数値の時刻文字列（abc:00）', () => {
    it('abc:00という非数値の時刻を設定すると、InvalidSchedulerConfigurationErrorが発生する', async () => {
      const scheduledExecutionTime = 'abc:00';

      await expect(
        judgeSchedulerExecutionTiming({
          currentTimestamp,
          scheduledExecutionTime,
          executionTimeToleranceMinutes,
          timeZone,
        })
      ).rejects.toThrow(InvalidSchedulerConfigurationError);

      try {
        await judgeSchedulerExecutionTiming({
          currentTimestamp,
          scheduledExecutionTime,
          executionTimeToleranceMinutes,
          timeZone,
        });
      } catch (error) {
        if (error instanceof InvalidSchedulerConfigurationError) {
          expect(error.message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
        }
      }
    });
  });

  it('処理は中断され、JudgeSchedulerExecutionTimingOutput出力型は返されない', async () => {
    const scheduledExecutionTime = '25:00';

    try {
      await judgeSchedulerExecutionTiming({
        currentTimestamp,
        scheduledExecutionTime,
        executionTimeToleranceMinutes,
        timeZone,
      });
      throw new Error('InvalidSchedulerConfigurationErrorが発生すべき');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
    }
  });
});
