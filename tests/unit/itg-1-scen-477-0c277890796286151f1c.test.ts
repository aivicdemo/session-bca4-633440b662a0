import { jest } from '@jest/globals';
import {
  saveReminderNotificationSettings,
  retrieveReporterByUserId,
  persistReporterMasterChangeHistory,
  SaveReminderNotificationSettingsInput,
  SaveReminderNotificationSettingsOutput,
  InvalidNotificationMethodError,
} from '../../src/logic/user-master-persistence';

describe('SCEN-477: 送信方法がシステム定義値に該当しない場合、InvalidNotificationMethodErrorが発生し失敗応答が返される', () => {
  it('should return error when sending method is invalid', async () => {
    const input: SaveReminderNotificationSettingsInput = {
      userId: 'user-123',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '水', '金'],
      sendingMethod: 'INVALID_METHOD',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    jest.mocked(retrieveReporterByUserId).mockResolvedValueOnce({
      success: true,
      reporter: {
        reporterId: 'RPT-001',
        userId: 'user-123',
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
    expect(result.message).toBe('指定された送信方法はサポートされていません。');
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
