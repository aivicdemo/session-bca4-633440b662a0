import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
  InvalidSettingParametersError,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReminderNotificationSettingsByUserId: jest.fn(),
}));

describe('SCEN-322: 送信時刻が24時間形式の有効値でない場合、入力値エラーが返される', () => {
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
  });

  it('送信時刻が25:00（24時間形式の無効値）の場合、InvalidSettingParametersErrorが返される', async () => {
    const reporterId = 'valid-reporter-001';
    const executionTimestamp = new Date();

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId,
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '25:00',
      sendingDaysOfWeek: [1, 3, 5],
      deliveryMethod: 'email',
      executionTimestamp,
    };

    // @ts-ignore
    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.errorDetails).toBe('リマインダー設定のパラメータが無効です。');
    expect(result.operation).toBe('register');
    expect(result.reminderSettingId).toBe(null);
    expect(result.appliedAt).toBe(null);

    // saveReminderNotificationSettingsが呼び出されないことを確認
    expect(mockSaveReminderNotificationSettings).not.toHaveBeenCalled();
  });
});
