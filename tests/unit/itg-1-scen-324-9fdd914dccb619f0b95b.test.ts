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

describe('SCEN-324: 送信方法が定義済みの値でない場合、入力値エラーが返される', () => {
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

  it('送信方法に定義済み値の範囲外の値が指定された場合、InvalidSettingParametersErrorが返される', async () => {
    const reporterId = 'reporter-001';
    const executionTimestamp = new Date();

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId,
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 3, 5],
      deliveryMethod: 'invalid-method',
      executionTimestamp,
    };

    // @ts-ignore
    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBe(null);
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBe(null);
    expect(result.errorDetails).toBe('リマインダー設定のパラメータが無効です。');

    // データベースへの永続化処理が実行されないことを確認
    expect(mockSaveReminderNotificationSettings).not.toHaveBeenCalled();
    expect(mockRetrieveReminderNotificationSettingsByUserId).not.toHaveBeenCalled();
  });
});
