import { jest } from '@jest/globals';
import {
  saveReminderNotificationSettings,
  retrieveReporterByUserId,
  persistReporterMasterChangeHistory,
  SaveReminderNotificationSettingsInput,
  SaveReminderNotificationSettingsOutput,
} from '../../src/logic/user-master-persistence';

describe('SCEN-473: チームリーダーが有効な入力値でリマインダー設定を保存すると、設定が永続化され成功応答が返される', () => {
  it('should save reminder notification settings successfully with valid input', async () => {
    const input: SaveReminderNotificationSettingsInput = {
      userId: '対象ユーザーID',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '水', '金'],
      sendingMethod: 'メール',
      leaderUserId: 'チームリーダーのユーザーID',
      updateTimestamp: new Date(),
    };

    jest.mocked(retrieveReporterByUserId).mockResolvedValueOnce({
      success: true,
      reporter: {
        reporterId: 'RPT-001',
        userId: '対象ユーザーID',
        reporterName: 'テストユーザー',
        emailAddress: 'test@example.com',
        department: '営業部',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: 'ユーザーが見つかりました。',
    });

    jest.mocked(persistReporterMasterChangeHistory).mockResolvedValueOnce({
      success: true,
      message: '変更履歴を記録しました。',
    });

    const result: SaveReminderNotificationSettingsOutput =
      await saveReminderNotificationSettings(input);

    expect(result.success).toBe(true);
    expect(result.reminderSettingId).not.toBeNull();
    expect(result.message).toContain('正常に保存されました');
    expect(persistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
