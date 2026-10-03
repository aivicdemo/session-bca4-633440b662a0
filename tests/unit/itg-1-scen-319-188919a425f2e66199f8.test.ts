import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  manageReminderNotificationSettings,
} from '../../src/logic/daily-report-reminder-notification';
import * as persistenceModule from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-319: チームリーダーが既存の報告者リマインダー設定を更新し、変更内容が保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update existing reminder notification settings and save changes', async () => {
    const now = new Date();
    const mockRetrieveSettings = persistenceModule.retrieveReminderNotificationSettingsByUserId as jest.MockedFunction<any>;
    const mockSaveSettings = persistenceModule.saveReminderNotificationSettings as jest.MockedFunction<any>;

    mockRetrieveSettings.mockResolvedValueOnce({
      success: true,
      reminderSetting: {
        reminderSettingId: 'reminder-001',
        userId: 'reporter-001',
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
      reminderSettingId: 'reminder-001',
      message: 'Settings updated successfully',
    });

    const input = {
      operation: 'update' as const,
      reporterId: 'reporter-001',
      reminderSettingId: 'reminder-001',
      enabledFlag: true,
      sendingTime: '14:30',
      sendingDaysOfWeek: [1, 2, 3, 4, 5, 6],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    const result = await manageReminderNotificationSettings(input);

    expect(result.success).toBe(true);
    expect(result.reminderSettingId).toBe('reminder-001');
    expect(result.operation).toBe('update');
    expect(result.appliedAt).not.toBeNull();
    expect(result.appliedAt instanceof Date).toBe(true);
    expect(result.errorDetails).toBeNull();

    expect(mockRetrieveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'reporter-001' })
    );

    expect(mockSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'reporter-001',
        enabledFlag: true,
        sendingTime: '14:30',
        sendingDaysOfWeek: ['1', '2', '3', '4', '5', '6'],
        sendingMethod: 'email',
      })
    );
  });
});
