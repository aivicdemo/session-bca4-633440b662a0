import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
} from '../../src/logic/daily-report-reminder-notification';
import * as persistenceModule from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-320: チームリーダーが報告者のリマインダー設定を削除し、設定が削除される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete existing reminder notification settings and return success', async () => {
    const reporterId = 'valid-reporter-001';
    const reminderSettingId = 'reminder-setting-uuid-001';
    const executionTimestamp = new Date('2026-09-24T10:00:00Z');

    const mockRetrieveSettings = persistenceModule.retrieveReminderNotificationSettingsByUserId as jest.MockedFunction<any>;
    const mockSaveSettings = persistenceModule.saveReminderNotificationSettings as jest.MockedFunction<any>;

    mockRetrieveSettings.mockResolvedValueOnce({
      success: true,
      reminderSetting: {
        reminderSettingId,
        userId: reporterId,
        enabledFlag: true,
        sendingTime: '09:00',
        sendingDaysOfWeek: ['1', '2', '3', '4', '5'],
        sendingMethod: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    mockSaveSettings.mockResolvedValueOnce({
      success: true,
      reminderSettingId: null,
      message: 'Settings deleted successfully',
    });

    const input = {
      operation: 'delete' as const,
      reporterId,
      reminderSettingId,
      enabledFlag: false,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp,
    };

    const result = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(true);
    expect(result.operation).toBe('delete');
    expect(result.reminderSettingId).toBeNull();
    expect(result.appliedAt).not.toBeNull();
    expect(result.appliedAt instanceof Date).toBe(true);
    expect(result.errorDetails).toBeNull();
  });
});
