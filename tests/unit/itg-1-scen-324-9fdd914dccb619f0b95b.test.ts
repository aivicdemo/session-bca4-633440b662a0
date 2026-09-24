import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
  InvalidSettingParametersError,
} from '../../src/logic/daily-report-reminder-notification';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-324: 送信方法が定義済みの値でない場合、入力値エラーが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deliveryMethod="invalid-method"（定義済み値の範囲外）で呼び出すとInvalidSettingParametersErrorが返される', () => {
    const mockRetrieve = jest.spyOn(
      userMasterPersistence,
      'retrieveReminderNotificationSettingsByUserId' as any
    );
    mockRetrieve.mockReturnValue([]);

    const mockSave = jest.spyOn(
      userMasterPersistence,
      'saveReminderNotificationSettings' as any
    );

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: 'reporter-001',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 3, 5],
      deliveryMethod: 'invalid-method',
      executionTimestamp: new Date().toISOString(),
    };

    const result: ManageReminderNotificationSettingsOutput =
      manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBe(null);
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBe(null);
    expect(result.errorDetails).toBe('リマインダー設定のパラメータが無効です。');
    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });
});
