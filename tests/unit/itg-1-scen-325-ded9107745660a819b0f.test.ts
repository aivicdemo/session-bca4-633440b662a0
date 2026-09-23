import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
  SettingNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReminderNotificationSettingsByUserId: jest.fn(),
}));

describe('SCEN-325: 削除操作時に指定されたリマインダー設定IDが存在しない場合、エラーが返される', () => {
  let mockSaveReminderNotificationSettings: jest.Mock;
  let mockRetrieveReminderNotificationSettingsByUserId: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveReminderNotificationSettings = require('../../src/logic/user-master-persistence.ts')
      .saveReminderNotificationSettings as jest.Mock;
    mockRetrieveReminderNotificationSettingsByUserId = require('../../src/logic/user-master-persistence.ts')
      .retrieveReminderNotificationSettingsByUserId as jest.Mock;

    // 存在しないIDなので空の結果を返す
    // @ts-ignore
    mockRetrieveReminderNotificationSettingsByUserId.mockResolvedValue([]);
  });

  it('削除操作で存在しないreminderSettingIdが指定された場合、SettingNotFoundErrorが返される', async () => {
    const reporterId = 'valid-reporter-id';
    const nonexistentSettingId = 'non-existent-setting-uuid';
    const executionTimestamp = new Date();

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'delete',
      reporterId,
      reminderSettingId: nonexistentSettingId,
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
    expect(result.operation).toBe('delete');
    expect(result.appliedAt).toBe(null);
    expect(result.errorDetails).toBe('指定されたリマインダー設定が見つかりません。');

    // 削除処理（saveReminderNotificationSettings）が呼び出されないことを確認
    expect(mockSaveReminderNotificationSettings).not.toHaveBeenCalled();
  });
});
