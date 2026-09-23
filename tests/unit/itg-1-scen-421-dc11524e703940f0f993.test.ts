import {
  saveDailyReport,
  SaveDailyReportInput,
  InvalidReportDateError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-421: 営業日でない報告日で日報保存を試みるとInvalidReportDateErrorが発生する', () => {
  it('営業日でない報告日（土曜日）で日報保存を試みるとInvalidReportDateErrorが発生する', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user001',
      reportDate: '2025-01-11',
      businessContent: '営業活動実施',
      submittedAt: '2025-01-11T09:00:00Z',
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
