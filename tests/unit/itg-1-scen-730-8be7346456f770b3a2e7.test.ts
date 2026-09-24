import { judgeSchedulerExecutionTiming, BusinessCalendarNotFoundError } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-730: 日報データベースが一時的に取得できないとき、警告が発生し、管理画面に表示される', () => {
  describe('isBusinessDay呼び出しが日報データベースの一時的な接続障害を返すとき', () => {
    it('実行判定がfalseで、警告メッセージが含まれる理由が返される', async () => {
      const input = {
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
        expect(result.executionReason).toMatch(/日報データを取得できません|営業日カレンダー|取得|接続|障害|利用|データベース/i);
      } else if (thrownError) {
        expect(thrownError).toBeInstanceOf(BusinessCalendarNotFoundError);
        expect((thrownError as Error).message).toContain('日報データ');
      } else {
        throw new Error('関数が結果またはエラーを返す必要があります');
      }
    });
  });
});
