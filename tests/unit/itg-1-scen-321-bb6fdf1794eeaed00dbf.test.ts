import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  type ManageReminderNotificationSettingsInput,
  type ManageReminderNotificationSettingsOutput,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-321: システムマスタに存在しない報告者IDでリマインダー設定を登録しようとすると、エラーが返される', () => {
  const nonexistentReporterId = 'reporter-nonexistent-999';
  const now = new Date();

  beforeEach(async () => {
    jest.resetModules();
    const userMasterPersistence = await import('../../src/logic/user-master-persistence');
    (userMasterPersistence as any).retrieveReminderNotificationSettingsByUserId = (jest.fn() as any).mockResolvedValue({
      success: false,
      reminderSetting: null,
      message: '指定された報告者が見つかりません。',
    });
    (userMasterPersistence as any).saveReminderNotificationSettings = jest.fn() as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('存在しない報告者IDでリマインダー設定を登録するとエラーが返される', async () => {
    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: nonexistentReporterId,
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBeNull();
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBeNull();
    expect(result.errorDetails).toBe('指定された報告者が見つかりません。');
  });
});
