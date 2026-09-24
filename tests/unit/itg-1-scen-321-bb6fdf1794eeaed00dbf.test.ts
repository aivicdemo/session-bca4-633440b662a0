import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
  ReporterNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-321: システムマスタに存在しない報告者IDでリマインダー設定を登録しようとすると、エラーが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在しない報告者IDでリマインダー設定を登録するとReporterNotFoundErrorが返される', () => {
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
      reporterId: 'reporter-nonexistent-999',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp: new Date().toISOString(),
    };

    const result: ManageReminderNotificationSettingsOutput =
      manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBe(null);
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBe(null);
    expect(result.errorDetails).toBe('指定された報告者が見つかりません。');
    expect(mockSave).not.toHaveBeenCalled();
  });
});
