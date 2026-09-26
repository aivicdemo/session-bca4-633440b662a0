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

describe('SCEN-322: 送信時刻が24時間形式の有効値でない場合、入力値エラーが返される', () => {
  const now = new Date();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendingTime="25:00"（24時間形式の無効値）で呼び出すとInvalidSettingParametersErrorが返される', async () => {
    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: 'valid-reporter-001',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '25:00',
      sendingDaysOfWeek: [1, 3, 5],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.errorDetails).toBe('リマインダー設定のパラメータが無効です。');
    expect(result.operation).toBe('register');
    expect(result.reminderSettingId).toBeNull();
    expect(result.appliedAt).toBeNull();
    expect(mockedSave).not.toHaveBeenCalled();
  });
});
