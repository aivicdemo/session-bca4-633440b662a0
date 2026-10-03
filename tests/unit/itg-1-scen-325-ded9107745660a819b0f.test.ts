import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  type ManageReminderNotificationSettingsInput,
  type ManageReminderNotificationSettingsOutput,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-325: 削除操作時に指定されたリマインダー設定IDが存在しない場合、エラーが返される', () => {
  const now = new Date();

  beforeEach(async () => {
    jest.resetModules();
    const userMasterPersistence = await import('../../src/logic/user-master-persistence');
    (userMasterPersistence as any).retrieveReminderNotificationSettingsByUserId = (jest.fn() as any).mockResolvedValue({
      success: false,
      reminderSetting: null,
      message: '指定されたリマインダー設定が見つかりません。',
    });
    (userMasterPersistence as any).saveReminderNotificationSettings = jest.fn() as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('存在しないreminderSettingIdで削除操作を実行するとエラーが返される', async () => {
    const testReporterId = 'valid-reporter-id';
    const nonExistentSettingId = 'non-existent-setting-uuid';

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'delete',
      reporterId: testReporterId,
      reminderSettingId: nonExistentSettingId,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBeNull();
    expect(result.operation).toBe('delete');
    expect(result.appliedAt).toBeNull();
    expect(result.errorDetails).toBe('指定されたリマインダー設定が見つかりません。');
  });
});
