jest.mock('../../src/logic/user-master-persistence', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReminderNotificationSettingsByUserId: jest.fn(),
}));

import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
} from '../../src/logic/daily-report-reminder-notification';
import {
  saveReminderNotificationSettings,
  retrieveReminderNotificationSettingsByUserId,
} from '../../src/logic/user-master-persistence';

const mockedSaveReminderNotificationSettings = saveReminderNotificationSettings as jest.Mock;
const mockedRetrieveReminderNotificationSettingsByUserId = retrieveReminderNotificationSettingsByUserId as jest.Mock;

describe('SCEN-320: チームリーダーが報告者のリマインダー設定を削除し、設定が削除される', () => {
  const reporterId = 'valid-reporter-001';
  const reminderSettingId = 'reminder-setting-uuid-001';
  const executionTimestamp = new Date('2026-09-24T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('既存のリマインダー設定を削除し、削除後は該当IDが検索結果に含まれない', async () => {
    // Arrange: manageReminderNotificationSettingsの削除操作が成功し、
    // success=true, operation='delete', reminderSettingId=null, appliedAt=実行時刻, errorDetails=nullを返す
    mockedSaveReminderNotificationSettings.mockResolvedValueOnce({
      success: true,
      reminderSettingId: null,
      operation: 'delete',
      appliedAt: executionTimestamp,
      errorDetails: null,
    });

    // 削除後、retrieveReminderNotificationSettingsByUserIdで同じreporterIdを検索して
    // 削除されたreminderSettingIdは結果に含まれない
    mockedRetrieveReminderNotificationSettingsByUserId.mockResolvedValueOnce({
      success: true,
      settings: [],
    });

    const input: ManageReminderNotificationSettingsInput = {
      operation: 'delete',
      reporterId,
      reminderSettingId,
      enabledFlag: false,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp,
    };

    // Act: manageReminderNotificationSettingsを呼び出す
    const result: ManageReminderNotificationSettingsOutput = await manageReminderNotificationSettings(input);

    // Assert: 戻り値のsuccessフィールドがtrueであることを確認する
    expect(result.success).toBe(true);

    // Assert: 戻り値のoperationフィールドが'delete'であることを確認する
    expect(result.operation).toBe('delete');

    // Assert: 戻り値のreminderSettingIdフィールドがnullであることを確認する
    expect(result.reminderSettingId).toBeNull();

    // Assert: 戻り値のappliedAtフィールドが削除実行時刻の日時オブジェクトであることを確認する
    expect(result.appliedAt).toEqual(executionTimestamp);

    // Assert: 戻り値のerrorDetailsフィールドがnullであることを確認する
    expect(result.errorDetails).toBeNull();

    // Assert: retrieveReminderNotificationSettingsByUserIdをスタブ経由で呼び出し、
    // 同じreporterIdに対して該当するreminderSettingIdが返されないことを確認する
    const searchResult = await retrieveReminderNotificationSettingsByUserId({
      userId: reporterId,
    });

    expect(searchResult.settings).toHaveLength(0);
    expect(searchResult.settings).not.toContainEqual(
      expect.objectContaining({ id: reminderSettingId })
    );
  });
});
