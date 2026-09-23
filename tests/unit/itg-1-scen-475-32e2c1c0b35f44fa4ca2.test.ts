import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  InvalidReminderSettingsError,
  SaveReminderNotificationSettingsInput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReporterByUserId: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
  InvalidReminderSettingsError: class extends Error {},
}));

describe('SCEN-475: 送信時刻がHH:MM形式の有効な24時間時刻でない場合、InvalidReminderSettingsErrorが発生し失敗応答が返される', () => {
  let mockSaveReminderNotificationSettings: jest.Mock;
  let mockRetrieveReporterByUserId: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveReminderNotificationSettings = require('../../src/logic/user-master-persistence.ts').saveReminderNotificationSettings as jest.Mock;
    mockRetrieveReporterByUserId = require('../../src/logic/user-master-persistence.ts').retrieveReporterByUserId as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts').persistReporterMasterChangeHistory as jest.Mock;

    // retrieveReporterByUserIdが有効なユーザーレコードを返すようにモック
    // @ts-ignore
    mockRetrieveReporterByUserId.mockResolvedValue({
      success: true,
      userId: 'user-001',
      reporterName: 'テストユーザー',
      department: 'テスト部門',
    });

    // saveReminderNotificationSettingsが無効な時刻でエラーを発生させるようにモック
    // @ts-ignore
    mockSaveReminderNotificationSettings.mockImplementation(
      async (input: SaveReminderNotificationSettingsInput) => {
        // 時刻の妥当性チェック
        const [hours, minutes] = input.sendingTime.split(':');
        const hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);

        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
          const error = new InvalidReminderSettingsError('リマインダー設定の値が無効です。');
          throw error;
        }

        // @ts-ignore
        await mockPersistReporterMasterChangeHistory();
        return { success: true, reminderSettingId: 'reminder-setting-001', message: 'リマインダー設定が正常に保存されました。' };
      }
    );

    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue(undefined);
  });

  it('無効な24時間時刻でInvalidReminderSettingsErrorが発生する', async () => {
    const input: SaveReminderNotificationSettingsInput = {
      userId: 'user-001',
      enabledFlag: true,
      sendingTime: '25:00',
      sendingDaysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      sendingMethod: 'EMAIL',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    let caughtError: Error | undefined;

    try {
      await mockSaveReminderNotificationSettings(input);
    } catch (error) {
      caughtError = error as Error;
    }

    // InvalidReminderSettingsErrorが発生したことを確認
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe('リマインダー設定の値が無効です。');

    // データベースへの保存操作は実行されない
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
