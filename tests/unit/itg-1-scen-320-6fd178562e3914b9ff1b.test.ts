import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReminderNotificationSettingsByUserId: jest.fn(),
}));

describe('SCEN-320: チームリーダーが報告者のリマインダー設定を削除し、設定が削除される', () => {
  let mockSaveReminderNotificationSettings: jest.Mock;
  let mockRetrieveReminderNotificationSettingsByUserId: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveReminderNotificationSettings = require('../../src/logic/user-master-persistence.ts')
      .saveReminderNotificationSettings as jest.Mock;
    mockRetrieveReminderNotificationSettingsByUserId = require('../../src/logic/user-master-persistence.ts')
      .retrieveReminderNotificationSettingsByUserId as jest.Mock;
  });

  it('既存のリマインダー設定を削除し、削除後は該当IDが検索結果に含まれない', async () => {
    const reporterId = 'valid-reporter-001';
    const reminderSettingId = 'reminder-setting-uuid-001';
    const executionTimestamp = new Date();

    // 削除後：該当IDが返されない
    // @ts-ignore
    mockRetrieveReminderNotificationSettingsByUserId.mockResolvedValue([]);

    // @ts-ignore
    mockSaveReminderNotificationSettings.mockResolvedValue({ success: true });

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'delete',
      reporterId,
      reminderSettingId,
      enabledFlag: false,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp,
    };

    // @ts-ignore
    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(true);
    expect(result.operation).toBe('delete');
    expect(result.reminderSettingId).toBe(null);
    expect(result.appliedAt).toEqual(executionTimestamp);
    expect(result.errorDetails).toBe(null);

    // 削除後、同じreporterIdで検索しても削除されたreminderSettingIdは返されないことを確認
    const searchResult = await mockRetrieveReminderNotificationSettingsByUserId();
    expect(searchResult).toEqual([]);
    expect(searchResult).not.toContainEqual(
      expect.objectContaining({ id: reminderSettingId })
    );
  });
});
