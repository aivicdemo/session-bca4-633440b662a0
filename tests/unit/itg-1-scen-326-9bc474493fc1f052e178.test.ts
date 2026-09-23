import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
  PersistenceFailureError,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReminderNotificationSettingsByUserId: jest.fn(),
}));

describe('SCEN-326: リマインダー設定の保存中にデータベース障害が発生すると、永続化失敗エラーが返される', () => {
  let mockSaveReminderNotificationSettings: jest.Mock;
  let mockRetrieveReminderNotificationSettingsByUserId: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveReminderNotificationSettings = require('../../src/logic/user-master-persistence.ts')
      .saveReminderNotificationSettings as jest.Mock;
    mockRetrieveReminderNotificationSettingsByUserId = require('../../src/logic/user-master-persistence.ts')
      .retrieveReminderNotificationSettingsByUserId as jest.Mock;

    // @ts-ignore
    mockRetrieveReminderNotificationSettingsByUserId.mockResolvedValue([]);

    // データベース障害を模擬：PersistenceFailureErrorをthrowする
    mockSaveReminderNotificationSettings.mockRejectedValue(
      // @ts-ignore
      new PersistenceFailureError('Database connection failed')
    );
  });

  it('保存中にデータベース障害が発生した場合、PersistenceFailureErrorが正しく処理され、エラーが返される', async () => {
    const reporterId = 'valid-reporter-001';
    const executionTimestamp = new Date();

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId,
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 3, 5],
      deliveryMethod: 'email',
      executionTimestamp,
    };

    // @ts-ignore
    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBe(null);
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBe(null);
    expect(result.errorDetails).toBe('リマインダー設定の保存に失敗しました。');

    // saveReminderNotificationSettingsが呼び出されたことを確認
    expect(mockSaveReminderNotificationSettings).toHaveBeenCalled();
  });
});
