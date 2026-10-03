import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  PersistenceFailureError,
  type ManageReminderNotificationSettingsInput,
  type ManageReminderNotificationSettingsOutput,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-326: リマインダー設定の保存中にデータベース障害が発生すると、永続化失敗エラーが返される', () => {
  const now = new Date();

  beforeEach(async () => {
    jest.resetModules();
    const userMasterPersistence = await import('../../src/logic/user-master-persistence');
    (userMasterPersistence as any).saveReminderNotificationSettings = (jest.fn() as any).mockRejectedValue(
      new PersistenceFailureError('リマインダー設定の保存に失敗しました。')
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('saveReminderNotificationSettingsが失敗するとエラー詳細が返される', async () => {
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
