import { sendReporterReminderNotification } from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-301: 送信結果の記録処理に失敗した場合、リマインダー通知の送信失敗を報告する', () => {
  it('送信結果記録失敗時: 例外をスロー', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(sendReporterReminderNotification(input)).rejects.toThrow(
      'リマインダー通知の送信結果記録に失敗しました。'
    );
  });
});
