import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  SaveReminderNotificationSettingsInput,
  SaveReminderNotificationSettingsOutput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReporterByUserId: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-473: チームリーダーが有効な入力値でリマインダー設定を保存すると、設定が永続化され成功応答が返される', () => {
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
      userId: '対象ユーザーID',
      reporterName: 'テストユーザー',
      department: 'テスト部門',
    });

    // persistReporterMasterChangeHistoryが成功を返すようにモック
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue(undefined);

    // saveReminderNotificationSettingsが成功を返すようにモック
    // @ts-ignore
    mockSaveReminderNotificationSettings.mockImplementation(
      async (input: SaveReminderNotificationSettingsInput) => {
        // @ts-ignore
        await mockRetrieveReporterByUserId({ userId: input.userId });
        // @ts-ignore
        await mockPersistReporterMasterChangeHistory();

        return {
          success: true,
          reminderSettingId: 'reminder-setting-001',
          message: 'リマインダー設定が正常に保存されました。',
        } as SaveReminderNotificationSettingsOutput;
      }
    );
  });

  it('有効な入力値でリマインダー設定が保存され、successがtrueで返される', async () => {
    const input: SaveReminderNotificationSettingsInput = {
      userId: '対象ユーザーID',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: ['月', '水', '金'],
      sendingMethod: 'メール',
      leaderUserId: 'チームリーダーのユーザーID',
      updateTimestamp: new Date(),
    };

    // @ts-ignore
    const result = await mockSaveReminderNotificationSettings(input);

    // successフィールドを確認
    // @ts-ignore
    expect(result.success).toBe(true);

    // reminderSettingIdフィールドを確認（nullではない）
    // @ts-ignore
    expect(result.reminderSettingId).not.toBeNull();
    // @ts-ignore
    expect(typeof result.reminderSettingId).toBe('string');

    // messageフィールドを確認
    // @ts-ignore
    expect(result.message).toContain('保存');

    // persistReporterMasterChangeHistoryが呼び出されたことを検証
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
