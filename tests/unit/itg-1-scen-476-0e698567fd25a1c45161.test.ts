import { saveReminderNotificationSettings, InvalidReminderSettingsError } from '../../src/logic/user-master-persistence';
import type { SaveReminderNotificationSettingsInput, SaveReminderNotificationSettingsOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-476: 送信曜日に月～日の有効な値以外が含まれている場合、InvalidReminderSettingsErrorが発生し失敗応答が返される', () => {
  it('should return error output when sending days of week contains invalid value', async () => {
    const userId = 'user-001';

    const input: SaveReminderNotificationSettingsInput = {
      userId: userId,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '火', '水', '木', '金', '土', '日', 'invalid'],
      sendingMethod: 'メール',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    await expect(saveReminderNotificationSettings(input)).rejects.toThrow(InvalidReminderSettingsError);
  });
});
