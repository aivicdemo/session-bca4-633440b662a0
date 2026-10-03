import { saveReminderNotificationSettings, UserNotFoundError } from '../../src/logic/user-master-persistence';
import type { SaveReminderNotificationSettingsInput, SaveReminderNotificationSettingsOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-474: 指定されたユーザーIDが存在しない場合、UserNotFoundErrorが発生し失敗応答が返される', () => {
  it('should return error output when user is not found', async () => {
    const nonExistentUserId = 'non-existent-user-id';

    const input: SaveReminderNotificationSettingsInput = {
      userId: nonExistentUserId,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '火', '水', '木', '金'],
      sendingMethod: 'メール',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    await expect(saveReminderNotificationSettings(input)).rejects.toThrow(UserNotFoundError);
  });
});
