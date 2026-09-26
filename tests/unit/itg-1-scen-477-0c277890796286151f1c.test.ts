import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveReminderNotificationSettings, retrieveReporterByUserId } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveReporterByUserId: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-477: 送信方法がシステム定義値に該当しない場合、InvalidNotificationMethodErrorが発生し失敗応答が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error response when sending method is not supported', async () => {
    const mockRetrieveReporter = retrieveReporterByUserId as jest.Mock<any>;
    mockRetrieveReporter.mockResolvedValueOnce({
      success: true,
      reporter: {
        reporterId: 'rpt-001',
        userId: 'user-123',
        reporterName: 'Test User',
        emailAddress: 'test@example.com',
        department: 'Engineering',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const input = {
      userId: 'user-123',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '水', '金'],
      sendingMethod: 'INVALID_METHOD',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const result = await saveReminderNotificationSettings(input);

    expect((result as any).success).toBe(false);
    expect((result as any).reminderSettingId).toBe(null);
    expect((result as any).message).toBe('指定された送信方法はサポートされていません。');
  });
});
