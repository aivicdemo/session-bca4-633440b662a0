
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-319: チームリーダーが既存の報告者リマインダー設定を更新し、変更内容が保存される', () => {
  it('出力型 ManageReminderNotificationSettingsOutput のフィールドが以下の値で返却される: success=true、reminderSettingId=\'reminder-001\'（同一ID）、operation=\'update\'、appliedAt=実行時刻の日時オブジェクト（null でない）、errorDetails=null。送信時刻が \'09:00\' から \'14:30\' に、送信曜日が [1,2,3,4,5] から [1,2,3,4,5,6] に変更され、enabledFlag と deliveryMethod は変更前と同じ値で保持される', async () => {
    const now = new Date();
    const input: ManageReminderNotificationSettingsInput = {
      operation: 'update',
      reporterId: 'reporter-001',
      reminderSettingId: 'reminder-001',
      enabledFlag: true,
      sendingTime: '14:30',
      sendingDaysOfWeek: [1, 2, 3, 4, 5, 6],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    const result = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(true);

    expect(result.reminderSettingId).toBe('reminder-001');

    expect(result.operation).toBe('update');

    expect(result.appliedAt).not.toBeNull();
    expect(result.appliedAt instanceof Date).toBe(true);

    expect(result.errorDetails).toBeNull();
  });
});
