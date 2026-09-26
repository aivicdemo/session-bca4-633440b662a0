import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
} from '../../src/logic/daily-report-reminder-notification';
import {
  saveReminderNotificationSettings,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

const mockedSave = saveReminderNotificationSettings as jest.MockedFunction<any>;

describe('SCEN-326: リマインダー設定の保存中にデータベース障害が発生すると、永続化失敗エラーが返される', () => {
  const now = new Date();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveReminderNotificationSettingsがPersistenceFailureErrorをthrowするとエラー詳細が返される', async () => {
    mockedSave.mockRejectedValueOnce(new Error('Database connection failed'));

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: 'valid-reporter-001',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 3, 5],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBeNull();
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBeNull();
    expect(result.errorDetails).toBe('リマインダー設定の保存に失敗しました。');
  });
});
