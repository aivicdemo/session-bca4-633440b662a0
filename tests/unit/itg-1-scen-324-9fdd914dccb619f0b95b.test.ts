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

describe('SCEN-324: 送信方法が定義済みの値でない場合、入力値エラーが返される', () => {
  const now = new Date();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deliveryMethod="invalid-method"（定義済み値の範囲外）で呼び出すとInvalidSettingParametersErrorが返される', async () => {
    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: 'reporter-001',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 3, 5],
      deliveryMethod: 'invalid-method',
      executionTimestamp: now,
    };

    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBeNull();
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBeNull();
    expect(result.errorDetails).toBe('リマインダー設定のパラメータが無効です。');
    expect(mockedRetrieve).not.toHaveBeenCalled();
    expect(mockedSave).not.toHaveBeenCalled();
  });
});
