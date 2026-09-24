import { jest } from '@jest/globals';
import {
  saveReminderNotificationSettings,
  retrieveReporterByUserId,
  persistReporterMasterChangeHistory,
  SaveReminderNotificationSettingsInput,
  SaveReminderNotificationSettingsOutput,
  InvalidReminderSettingsError,
} from '../../src/logic/user-master-persistence';

describe('SCEN-476: 送信曜日に月～日の有効な値以外が含まれている場合、InvalidReminderSettingsErrorが発生し失敗応答が返される', () => {
  it('should return error when sending days of week contain invalid value', async () => {
    const input: SaveReminderNotificationSettingsInput = {
      userId: 'user-001',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '火', '水', '木', '金', '土', '日', 'invalid'],
      sendingMethod: 'メール',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    jest.mocked(retrieveReporterByUserId).mockResolvedValueOnce({
      success: true,
      reporter: {
        reporterId: 'RPT-001',
        userId: 'user-001',
        reporterName: 'テストユーザー',
        emailAddress: 'test@example.com',
        department: '営業部',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: 'ユーザーが見つかりました。',
    });

    const result: SaveReminderNotificationSettingsOutput =
      await saveReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBeNull();
    expect(result.message).toBe('リマインダー設定の値が無効です。');
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
