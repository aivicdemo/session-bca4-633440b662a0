import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
  InvalidSettingParametersError,
} from '../../src/logic/daily-report-reminder-notification';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-323: 送信曜日に0～6の範囲外の値が含まれる場合、入力値エラーが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendingDaysOfWeek=[7]（範囲外の値）で呼び出すとInvalidSettingParametersErrorが返される', () => {
    const mockSave = jest.spyOn(
      userMasterPersistence,
      'saveReminderNotificationSettings' as any
    );

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: 'valid-reporter-id',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [7],
      deliveryMethod: 'email',
      executionTimestamp: new Date().toISOString(),
    };

    const result: ManageReminderNotificationSettingsOutput =
      manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBe(null);
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBe(null);
    expect(result.errorDetails).toBe('リマインダー設定のパラメータが無効です。');
    expect(mockSave).not.toHaveBeenCalled();
  });
});
