import {
  saveDailyReport,
  SaveDailyReportInput,
  InvalidReportDateError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-422: 未来日の報告日で日報保存を試みるとInvalidReportDateErrorが発生する', () => {
  it('未来日の報告日で日報保存を試みるとInvalidReportDateErrorが発生する', async () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowDateString = tomorrow.toISOString().split('T')[0];
    const tomorrowTimeString = tomorrow.toISOString();

    const input: SaveDailyReportInput = {
      userId: 'valid-user',
      reportDate: tomorrowDateString,
      businessContent: '有効な業務内容',
      submittedAt: tomorrowTimeString,
    };

    try {
      await saveDailyReport(input);
      fail('InvalidReportDateError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidReportDateError);
      expect(error).toBeDefined();
      if (error instanceof InvalidReportDateError) {
        expect(error.message).toBe('報告日は営業日である必要があります。');
      }
    }
  });
});
