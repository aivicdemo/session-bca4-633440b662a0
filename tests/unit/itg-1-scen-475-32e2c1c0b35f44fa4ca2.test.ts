import { saveReminderNotificationSettings, InvalidReminderSettingsError } from '../../src/logic/user-master-persistence';
import type { SaveReminderNotificationSettingsInput, SaveReminderNotificationSettingsOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-475: 送信時刻がHH:MM形式の有効な24時間時刻でない場合、InvalidReminderSettingsErrorが発生し失敗応答が返される', () => {
  it('should return error output when sending time is not valid 24-hour format', async () => {
    const userId = 'user-001';

    const input: SaveReminderNotificationSettingsInput = {
      userId: userId,
      enabledFlag: true,
      sendingTime: '25:00',
      sendingDaysOfWeek: ['月', '火', '水', '木', '金'],
      sendingMethod: 'メール',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    await expect(saveReminderNotificationSettings(input)).rejects.toThrow(InvalidReminderSettingsError);
  });
});
