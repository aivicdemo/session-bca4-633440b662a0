import { sendReporterReminderNotification } from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-298: 通知内容の構築に失敗した場合、リマインダー通知の送信を中止する', () => {
  it('通知内容構築失敗時: リマインダー通知の送信を中止する', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    const result = await sendReporterReminderNotification(input);

    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('リマインダー通知内容の構築に失敗しました。');
  });
});
