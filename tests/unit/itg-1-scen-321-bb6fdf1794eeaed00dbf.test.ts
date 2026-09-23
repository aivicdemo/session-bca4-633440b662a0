import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
  ReporterNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReminderNotificationSettingsByUserId: jest.fn(),
}));

describe('SCEN-321: システムマスタに存在しない報告者IDでリマインダー設定を登録しようとすると、エラーが返される', () => {
  let mockSaveReminderNotificationSettings: jest.Mock;
  let mockRetrieveReminderNotificationSettingsByUserId: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveReminderNotificationSettings = require('../../src/logic/user-master-persistence.ts')
      .saveReminderNotificationSettings as jest.Mock;
    mockRetrieveReminderNotificationSettingsByUserId = require('../../src/logic/user-master-persistence.ts')
      .retrieveReminderNotificationSettingsByUserId as jest.Mock;

    // 存在しない報告者IDの場合、空の結果を返す
    // @ts-ignore
    mockRetrieveReminderNotificationSettingsByUserId.mockResolvedValue([]);
  });

  it('存在しない報告者IDで登録を試みた場合、ReporterNotFoundErrorが返される', async () => {
    const nonexistentReporterId = 'reporter-nonexistent-999';
    const executionTimestamp = new Date();

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: nonexistentReporterId,
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp,
    };

    // @ts-ignore
    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBe(null);
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBe(null);
    expect(result.errorDetails).toBe('指定された報告者が見つかりません。');

    // saveReminderNotificationSettingsが呼び出されないことを確認
    expect(mockSaveReminderNotificationSettings).not.toHaveBeenCalled();
  });
});
