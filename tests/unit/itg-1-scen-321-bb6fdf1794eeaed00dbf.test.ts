import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
} from '../../src/logic/daily-report-reminder-notification';
import {
  retrieveReminderNotificationSettingsByUserId,
  saveReminderNotificationSettings,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

const mockedRetrieve = retrieveReminderNotificationSettingsByUserId as jest.MockedFunction<any>;
const mockedSave = saveReminderNotificationSettings as jest.MockedFunction<any>;

describe('SCEN-321: システムマスタに存在しない報告者IDでリマインダー設定を登録しようとすると、エラーが返される', () => {
  const nonexistentReporterId = 'reporter-nonexistent-999';
  const now = new Date();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在しない報告者IDでリマインダー設定を登録するとReporterNotFoundErrorが返される', async () => {
    mockedRetrieve.mockResolvedValueOnce({
      success: false,
      reminderSetting: null,
      message: '指定された報告者が見つかりません。',
    });

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
    expect(mockedSave).not.toHaveBeenCalled();
  });
});
