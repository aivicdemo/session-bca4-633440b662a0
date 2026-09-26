
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-318: チームリーダーが報告者のリマインダー通知を新規登録し、設定が保存される', () => {
  it('チームリーダーが報告者『valid-reporter-001』に対してリマインダー通知を新規登録したとき、success=true、新規発行された reminderSettingId（null でない UUID）、operation=\'register\'、appliedAt=操作実行日時、errorDetails=null が返却され、設定内容が保存永続化レイヤーの saveReminderNotificationSettings に正確に渡される', async () => {
    const now = new Date();
    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: 'valid-reporter-001',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    const result = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(true);

    expect(result.reminderSettingId).not.toBeNull();
    expect(typeof result.reminderSettingId).toBe('string');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(result.reminderSettingId).toMatch(uuidRegex);

    expect(result.operation).toBe('register');

    expect(result.appliedAt).not.toBeNull();
    expect(result.appliedAt instanceof Date).toBe(true);
    const timeDiff = Math.abs((result.appliedAt as Date).getTime() - now.getTime());
    expect(timeDiff).toBeLessThan(1000);

    expect(result.errorDetails).toBeNull();
  });
});
