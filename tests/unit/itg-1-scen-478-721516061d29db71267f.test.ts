import { saveReminderNotificationSettings, PersistenceFailureError } from '../../src/logic/user-master-persistence';
import type { SaveReminderNotificationSettingsInput, SaveReminderNotificationSettingsOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-478: データベースへの保存操作が失敗した場合、PersistenceFailureErrorが発生し失敗応答が返される', () => {
  it('should return error output when database persistence fails', async () => {
    const userId = 'user-123';

    const input: SaveReminderNotificationSettingsInput = {
      userId: userId,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '火', '水', '木', '金'],
      sendingMethod: 'メール',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    await expect(saveReminderNotificationSettings(input)).rejects.toThrow(PersistenceFailureError);
  });
});
