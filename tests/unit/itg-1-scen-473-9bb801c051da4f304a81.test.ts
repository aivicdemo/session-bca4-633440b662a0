import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveReminderNotificationSettings, retrieveReporterByUserId, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveReporterByUserId: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-473: チームリーダーが有効な入力値でリマインダー設定を保存すると、設定が永続化され成功応答が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save reminder notification settings successfully', async () => {
    const mockRetrieveReporter = retrieveReporterByUserId as jest.Mock<any>;
    const mockPersistChangeHistory = persistReporterMasterChangeHistory as jest.Mock<any>;

    mockRetrieveReporter.mockResolvedValueOnce({
      success: true,
      reporter: {
        reporterId: 'rpt-123',
        userId: 'user-123',
        reporterName: 'Test User',
        emailAddress: 'test@example.com',
        department: 'Engineering',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    mockPersistChangeHistory.mockResolvedValueOnce({
      success: true,
      changeHistoryId: 'history-789',
      message: '変更履歴が記録されました。',
    });

    const input = {
      userId: 'user-123',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '水', '金'],
      sendingMethod: 'メール',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    const result = await saveReminderNotificationSettings(input);

    expect((result as any).success).toBe(true);
    expect((result as any).reminderSettingId).not.toBe(null);
    expect((result as any).message).toBe('リマインダー設定が正常に保存されました。');

    expect(mockPersistChangeHistory).toHaveBeenCalledTimes(1);
  });
});
