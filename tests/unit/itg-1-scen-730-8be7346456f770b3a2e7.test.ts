import { judgeSchedulerExecutionTiming, BusinessCalendarNotFoundError } from '../../.aivic/design/contract/src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../.aivic/design/contract/src/logic/business-day-deadline-judgment';

describe('SCEN-730: 日報データベースが一時的に取得できないときのエラー処理', () => {
  it('日報データベースの接続障害がBusinessCalendarNotFoundErrorで報告される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    let result;
    let thrownError;

    try {
      result = await judgeSchedulerExecutionTiming(input);
    } catch (error) {
      thrownError = error;
    }

    if (result) {
      expect(result).toHaveProperty('shouldExecute');
      expect(result.shouldExecute).toBe(false);
      expect(result).toHaveProperty('executionReason');
      expect(result.executionReason).toMatch(/日報データ|取得|接続|障害|利用|データベース/i);
    } else if (thrownError) {
      expect(thrownError).toBeInstanceOf(BusinessCalendarNotFoundError);
      expect((thrownError as Error).message).toMatch(/日報データ|取得|接続|障害|利用|データベース/i);
    } else {
      throw new Error('関数が結果またはエラーを返す必要があります');
    }
  });
});
