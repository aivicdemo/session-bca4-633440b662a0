import { sendReporterReminderNotification } from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-297: リマインダー設定が無効、送信時刻が未到来、または対象報告者が非アクティブな場合、リマインダー通知の送信を拒否する', () => {
  it('適格性チェック失敗時: リマインダー通知の送信を拒否する', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2025-01-15'),
      reminderSettingId: 'setting-invalid-or-inactive',
      executionTimestamp: new Date('2025-01-14T16:00:00Z'),
    };

    const result = await sendReporterReminderNotification(input);

    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('リマインダー通知の送信条件を満たしていません。');
  });
});
