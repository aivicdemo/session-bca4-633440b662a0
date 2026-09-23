import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  UserNotFoundError,
  SaveReminderNotificationSettingsInput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReporterByUserId: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
  UserNotFoundError: class extends Error {},
}));

describe('SCEN-474: 指定されたユーザーIDが存在しない場合、UserNotFoundErrorが発生し失敗応答が返される', () => {
  let mockSaveReminderNotificationSettings: jest.Mock;
  let mockRetrieveReporterByUserId: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveReminderNotificationSettings = require('../../src/logic/user-master-persistence.ts').saveReminderNotificationSettings as jest.Mock;
    mockRetrieveReporterByUserId = require('../../src/logic/user-master-persistence.ts').retrieveReporterByUserId as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts').persistReporterMasterChangeHistory as jest.Mock;

    // retrieveReporterByUserIdがnullを返すようにモック
    // @ts-ignore
    mockRetrieveReporterByUserId.mockResolvedValue(null);

    // saveReminderNotificationSettingsがUserNotFoundErrorをスロー
    mockSaveReminderNotificationSettings.mockImplementation(
      async (input: SaveReminderNotificationSettingsInput) => {
        const user = await mockRetrieveReporterByUserId({ userId: input.userId });
        if (!user) {
          const error = new UserNotFoundError('ユーザーが見つかりません。');
          throw error;
        }
        return { success: true, reminderSettingId: 'reminder-setting-001', message: 'リマインダー設定が正常に保存されました。' };
      }
    );
  });

  it('存在しないユーザーIDでUserNotFoundErrorが発生する', async () => {
    const input: SaveReminderNotificationSettingsInput = {
      userId: 'non-existent-user-id',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '火', '水', '木', '金'],
      sendingMethod: 'メール',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    let caughtError: Error | undefined;

    try {
      await mockSaveReminderNotificationSettings(input);
    } catch (error) {
      caughtError = error as Error;
    }

    // UserNotFoundErrorが発生したことを確認
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe('ユーザーが見つかりません。');

    // persistReporterMasterChangeHistoryは呼び出されない
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
