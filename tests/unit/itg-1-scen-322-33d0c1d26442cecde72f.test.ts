import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
  InvalidSettingParametersError,
} from '../../src/logic/daily-report-reminder-notification';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-322: 送信時刻が24時間形式の有効値でない場合、入力値エラーが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendingTime="25:00"（24時間形式の無効値）で呼び出すとInvalidSettingParametersErrorが返される', () => {
    const mockSave = jest.spyOn(
      userMasterPersistence,
      'saveReminderNotificationSettings' as any
    );

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: 'valid-reporter-001',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '25:00',
      sendingDaysOfWeek: [1, 3, 5],
      deliveryMethod: 'email',
      executionTimestamp: new Date().toISOString(),
    };

    const result: ManageReminderNotificationSettingsOutput =
      manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.errorDetails).toBe('リマインダー設定のパラメータが無効です。');
    expect(result.operation).toBe('register');
    expect(result.reminderSettingId).toBe(null);
    expect(result.appliedAt).toBe(null);
    expect(mockSave).not.toHaveBeenCalled();
  });
});
