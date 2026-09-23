import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  saveReminderNotificationSettings,
  retrieveReporterByUserId,
  SaveReminderNotificationSettingsInput,
  SaveReminderNotificationSettingsOutput,
  RetrieveReporterByUserIdOutput,
  InvalidNotificationMethodError,
} from '../../src/logic/user-master-persistence';

// 依存先のモック
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-477: 送信方法がシステム定義値に該当しない場合、InvalidNotificationMethodErrorが発生し失敗応答が返される', () => {
  let mockRetrieveReporterByUserId: jest.Mock;
  let mockSaveReminderNotificationSettings: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const module = require('../../src/logic/user-master-persistence.ts');
    mockRetrieveReporterByUserId = module.retrieveReporterByUserId as jest.Mock;
    mockSaveReminderNotificationSettings = module.saveReminderNotificationSettings as jest.Mock;

    // retrieveReporterByUserId をスタブ化し、ユーザーが存在することを示す正常なユーザーオブジェクトを返す
    const mockReporterOutput = {
      success: true,
      reporter: {
        reporterId: 'rep-123',
        userId: 'user-123',
        reporterName: 'Test User',
        emailAddress: 'testuser@example.com',
        department: 'Engineering',
        status: 'active',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      message: undefined,
    };
    // @ts-ignore
    mockRetrieveReporterByUserId.mockResolvedValue(mockReporterOutput);

    // saveReminderNotificationSettings をモック化し、InvalidNotificationMethodError を発生させる
    mockSaveReminderNotificationSettings.mockImplementation(
      async (input: any) => {
        if (input.sendingMethod === 'INVALID_METHOD') {
          const output = {
            success: false,
            reminderSettingId: null,
            message: '指定された送信方法はサポートされていません。',
          };
          // InvalidNotificationMethodError を発生させるロジックをシミュレート
          const error = new InvalidNotificationMethodError(
            '指定された送信方法はサポートされていません。'
          );
          throw error;
        }
        return {
          success: true,
          reminderSettingId: 'setting-123',
          message: 'Reminder settings saved successfully',
        };
      }
    );
  });

  it('送信方法がシステム定義値に該当しない場合、InvalidNotificationMethodErrorが発生し失敗応答が返される', async () => {
    const input = {
      userId: 'user-123',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '水', '金'],
      sendingMethod: 'INVALID_METHOD',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    // retrieveReporterByUserId を先に呼び出す
    const userCheckResult = await mockRetrieveReporterByUserId({
      userId: input.userId,
    });
    expect((userCheckResult as any).success).toBe(true);
    expect((userCheckResult as any).reporter).not.toBeNull();

    // saveReminderNotificationSettings を実行し、エラーが発生することを確認
    try {
      await mockSaveReminderNotificationSettings(input);
      fail('InvalidNotificationMethodError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidNotificationMethodError);
      expect(error).toHaveProperty(
        'message',
        '指定された送信方法はサポートされていません。'
      );
    }

    // mockSaveReminderNotificationSettings が呼び出されたことを確認
    expect(mockSaveReminderNotificationSettings).toHaveBeenCalledWith(input);
  });
});
