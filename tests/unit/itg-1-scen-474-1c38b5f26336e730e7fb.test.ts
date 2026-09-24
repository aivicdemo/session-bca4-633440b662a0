import { jest } from '@jest/globals';
import {
  saveReminderNotificationSettings,
  retrieveReporterByUserId,
  persistReporterMasterChangeHistory,
  SaveReminderNotificationSettingsInput,
  SaveReminderNotificationSettingsOutput,
  UserNotFoundError,
} from '../../src/logic/user-master-persistence';

describe('SCEN-474: 指定されたユーザーIDが存在しない場合、UserNotFoundErrorが発生し失敗応答が返される', () => {
  it('should return error when user is not found', async () => {
    const input: SaveReminderNotificationSettingsInput = {
      userId: 'non-existent-user-id',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '火', '水', '木', '金'],
      sendingMethod: 'メール',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    jest.mocked(retrieveReporterByUserId).mockResolvedValueOnce({
      success: false,
      reporter: null,
      message: 'ユーザーが見つかりません。',
    });

    const result: SaveReminderNotificationSettingsOutput =
      await saveReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBeNull();
    expect(result.message).toBe('ユーザーが見つかりません。');
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
