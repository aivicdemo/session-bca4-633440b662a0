import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
  PersistenceFailureError,
} from '../../src/logic/daily-report-reminder-notification';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-326: リマインダー設定の保存中にデータベース障害が発生すると、永続化失敗エラーが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveReminderNotificationSettingsがPersistenceFailureErrorをthrowするとエラー詳細が返される', () => {
    const mockSave = jest.spyOn(
      userMasterPersistence,
      'saveReminderNotificationSettings' as any
    );
    mockSave.mockImplementation(() => {
      throw new PersistenceFailureError('Database connection failed');
    });

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: 'valid-reporter-001',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 3, 5],
      deliveryMethod: 'email',
      executionTimestamp: new Date().toISOString(),
    };

    const result: ManageReminderNotificationSettingsOutput =
      manageReminderNotificationSettings(input);

    expect(result.success).toBe(false);
    expect(result.reminderSettingId).toBe(null);
    expect(result.operation).toBe('register');
    expect(result.appliedAt).toBe(null);
    expect(result.errorDetails).toBe('リマインダー設定の保存に失敗しました。');
  });
});
