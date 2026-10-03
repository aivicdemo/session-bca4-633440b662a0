import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
} from '../../src/logic/daily-report-reminder-notification';
import * as persistenceModule from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-318: チームリーダーが報告者のリマインダー通知を新規登録し、設定が保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register new reminder notification settings and save them to persistence layer', async () => {
    const now = new Date();
    const mockSaveReminderNotificationSettings = persistenceModule.saveReminderNotificationSettings as jest.MockedFunction<any>;

    mockSaveReminderNotificationSettings.mockResolvedValueOnce({
      success: true,
      reminderSettingId: '550e8400-e29b-41d4-a716-446655440000',
      message: 'Settings saved successfully',
    });

    const input = {
      operation: 'register' as const,
      reporterId: 'valid-reporter-001',
      reminderSettingId: undefined,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    const result = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(true);
    expect(result.reminderSettingId).not.toBeNull();
    expect(typeof result.reminderSettingId).toBe('string');

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(result.reminderSettingId).toMatch(uuidRegex);

    expect(result.operation).toBe('register');

    expect(result.appliedAt).not.toBeNull();
    expect(result.appliedAt instanceof Date).toBe(true);

    expect(result.errorDetails).toBeNull();

    expect(mockSaveReminderNotificationSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'valid-reporter-001',
        enabledFlag: true,
        sendingTime: '09:00',
        sendingDaysOfWeek: ['1', '2', '3', '4', '5'],
        sendingMethod: 'email',
      })
    );
  });
});
