import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveReminderNotificationSettings, retrieveReporterByUserId } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveReporterByUserId: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-475: 送信時刻がHH:MM形式の有効な24時間時刻でない場合、InvalidReminderSettingsErrorが発生し失敗応答が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error response when sending time is invalid', async () => {
    const mockRetrieveReporter = retrieveReporterByUserId as jest.Mock<any>;
    mockRetrieveReporter.mockResolvedValueOnce({
      success: true,
      reporter: {
        reporterId: 'rpt-001',
        userId: 'user-001',
        reporterName: 'Test User',
        emailAddress: 'test@example.com',
        department: 'Engineering',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const input = {
      userId: 'user-001',
      enabledFlag: true,
      sendingTime: '25:00',
      sendingDaysOfWeek: ['月', '火', '水', '木', '金'],
      sendingMethod: 'メール',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    const result = await saveReminderNotificationSettings(input);

    expect((result as any).success).toBe(false);
    expect((result as any).reminderSettingId).toBe(null);
    expect((result as any).message).toBe('リマインダー設定の値が無効です。');
  });
});
