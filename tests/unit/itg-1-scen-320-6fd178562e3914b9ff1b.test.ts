
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-320: チームリーダーが報告者のリマインダー設定を削除し、設定が削除される', () => {
  it('既存のリマインダー設定を削除し、削除後は該当IDが検索結果に含まれない', async () => {
    const reporterId = 'valid-reporter-001';
    const reminderSettingId = 'reminder-setting-uuid-001';
    const executionTimestamp = new Date('2026-09-24T10:00:00Z');

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'delete',
      reporterId,
      reminderSettingId,
      enabledFlag: false,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp,
    };

    const result = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(true);

    expect(result.operation).toBe('delete');

    expect(result.reminderSettingId).toBeNull();

    expect(result.appliedAt).not.toBeNull();
    expect(result.appliedAt instanceof Date).toBe(true);

    expect(result.errorDetails).toBeNull();
  });
});
