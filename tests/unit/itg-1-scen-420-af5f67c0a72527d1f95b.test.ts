import {
  saveDailyReport,
  SaveDailyReportInput,
  InvalidUserIdError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-420: 無効または存在しないユーザーIDで日報保存を試みるとInvalidUserIdErrorが発生する', () => {
  it('無効なユーザーIDで日報保存を試みるとInvalidUserIdErrorが発生し、エラーメッセージが正確である', async () => {
    const input: SaveDailyReportInput = {
      userId: 'invalid-user-id',
      reportDate: '2025-01-15',
      businessContent: '本日の業務内容',
      submittedAt: '2025-01-15T09:00:00Z',
    };

    try {
      await saveDailyReport(input);
      fail('InvalidUserIdError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidUserIdError);
      expect(error).toBeDefined();
      if (error instanceof InvalidUserIdError) {
        expect(error.message).toBe('指定されたユーザーIDは無効です。');
      }
    }
  });
});
