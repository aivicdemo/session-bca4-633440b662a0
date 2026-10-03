import { saveReminderNotificationSettings, InvalidNotificationMethodError } from '../../src/logic/user-master-persistence';
import type { SaveReminderNotificationSettingsInput, SaveReminderNotificationSettingsOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-477: 送信方法がシステム定義値に該当しない場合、InvalidNotificationMethodErrorが発生し失敗応答が返される', () => {
  it('should return error output when notification method is not supported', async () => {
    const userId = 'user-123';

    const input: SaveReminderNotificationSettingsInput = {
      userId: userId,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '水', '金'],
      sendingMethod: 'INVALID_METHOD',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    await expect(saveReminderNotificationSettings(input)).rejects.toThrow(InvalidNotificationMethodError);
  });
});
