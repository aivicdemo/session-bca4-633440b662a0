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

describe('SCEN-323: 送信曜日に0～6の範囲外の値が含まれる場合、入力値エラーが返される', () => {
  const now = new Date();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendingDaysOfWeek=[7]（範囲外の値）で呼び出すとInvalidSettingParametersErrorが返される', async () => {
    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: 'valid-reporter-id',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [7],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBeNull();
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBeNull();
    expect(result.errorDetails).toBe('リマインダー設定のパラメータが無効です。');
    expect(mockedSave).not.toHaveBeenCalled();
  });
});
