import { saveReminderNotificationSettings } from '../../src/logic/user-master-persistence';
import type { SaveReminderNotificationSettingsInput, SaveReminderNotificationSettingsOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-473: チームリーダーが有効な入力値でリマインダー設定を保存すると、設定が永続化され成功応答が返される', () => {
  it('should save reminder notification settings successfully with valid input', async () => {
    const leaderUserId = 'leader-001';
    const userId = 'user-001';
    const updateTimestamp = new Date();

    const input: SaveReminderNotificationSettingsInput = {
      userId: userId,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '水', '金'],
      sendingMethod: 'メール',
      leaderUserId: leaderUserId,
      updateTimestamp: updateTimestamp,
    };

    const result = await saveReminderNotificationSettings(input);

    expect(result.success).toBe(true);
    expect(result.reminderSettingId).not.toBeNull();
    expect(typeof result.reminderSettingId).toBe('string');
    expect(result.message).toBeTruthy();
  });
});
