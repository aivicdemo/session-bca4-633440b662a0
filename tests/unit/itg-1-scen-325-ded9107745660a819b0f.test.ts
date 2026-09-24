import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
  SettingNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-325: 削除操作時に指定されたリマインダー設定IDが存在しない場合、エラーが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在しないreminderSettingIdで削除操作を実行するとSettingNotFoundErrorが返される', () => {
    const mockRetrieve = jest.spyOn(
      userMasterPersistence,
      'retrieveReminderNotificationSettingsByUserId' as any
    );
    mockRetrieve.mockReturnValue(null);

    const mockSave = jest.spyOn(
      userMasterPersistence,
      'saveReminderNotificationSettings' as any
    );

    const testReporterId = 'valid-reporter-id';
    const nonExistentSettingId = 'non-existent-setting-uuid';
    const currentTimestamp = new Date().toISOString();

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'delete',
      reporterId: testReporterId,
      reminderSettingId: nonExistentSettingId,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp: currentTimestamp,
    };

    const result: ManageReminderNotificationSettingsOutput =
      manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBe(null);
    expect(result.operation).toBe('delete');
    expect(result.appliedAt).toBe(null);
    expect(result.errorDetails).toBe('指定されたリマインダー設定が見つかりません。');
    expect(mockSave).not.toHaveBeenCalled();
  });
});
