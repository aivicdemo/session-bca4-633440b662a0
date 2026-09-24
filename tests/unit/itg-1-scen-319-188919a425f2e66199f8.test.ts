import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-master-persistence', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReminderNotificationSettingsByUserId: jest.fn(),
}));

describe('SCEN-319: チームリーダーが既存の報告者リマインダー設定を更新し、変更内容が保存される', () => {
  let mockSaveReminderNotificationSettings: jest.Mock;
  let mockRetrieveReminderNotificationSettingsByUserId: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const persistenceModule = require('../../src/logic/user-master-persistence');
    mockSaveReminderNotificationSettings = persistenceModule.saveReminderNotificationSettings as jest.Mock;
    mockRetrieveReminderNotificationSettingsByUserId = persistenceModule.retrieveReminderNotificationSettingsByUserId as jest.Mock;

    mockRetrieveReminderNotificationSettingsByUserId.mockReturnValue({
      reminderSettingId: 'reminder-001',
      reporterId: 'reporter-001',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
    });

    mockSaveReminderNotificationSettings.mockReturnValue({
      reminderSettingId: 'reminder-001',
      reporterId: 'reporter-001',
      enabledFlag: true,
      sendingTime: '14:30',
      sendingDaysOfWeek: [1, 2, 3, 4, 5, 6],
      deliveryMethod: 'email',
    });
  });

  test('出力型 ManageReminderNotificationSettingsOutput のフィールドが以下の値で返却される: success=true、reminderSettingId=\'reminder-001\'（同一ID）、operation=\'update\'、appliedAt=実行時刻の日時オブジェクト（null でない）、errorDetails=null。送信時刻が \'09:00\' から \'14:30\' に、送信曜日が [1,2,3,4,5] から [1,2,3,4,5,6] に変更され、enabledFlag と deliveryMethod は変更前と同じ値で保持される', () => {
    // テスト用の既存リマインダー設定を事前に準備する
    const existingSettings = {
      reminderSettingId: 'reminder-001',
      reporterId: 'reporter-001',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
    };

    // retrieveReminderNotificationSettingsByUserId('reporter-001') をスタブで呼び出し、上記の既存設定が取得されることを確認する
    const retrievedSettings = mockRetrieveReminderNotificationSettingsByUserId('reporter-001');
    expect(retrievedSettings).toEqual(existingSettings);

    // manageReminderNotificationSettings を以下の入力で呼び出す
    const now = new Date();
    const input: ManageReminderNotificationSettingsInput = {
      operation: 'update',
      reporterId: 'reporter-001',
      reminderSettingId: 'reminder-001',
      enabledFlag: true,
      sendingTime: '14:30',
      sendingDaysOfWeek: [1, 2, 3, 4, 5, 6],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    // manageReminderNotificationSettings を呼び出す
    const result: ManageReminderNotificationSettingsOutput = manageReminderNotificationSettings(input);

    // 出力を検証する
    // success=true
    expect(result.success).toBe(true);

    // reminderSettingId='reminder-001'（同一ID）
    expect(result.reminderSettingId).toBe('reminder-001');

    // operation='update'
    expect(result.operation).toBe('update');

    // appliedAt=実行時刻の日時オブジェクト（null でない）
    expect(result.appliedAt).not.toBeNull();
    expect(result.appliedAt instanceof Date).toBe(true);

    // errorDetails=null
    expect(result.errorDetails).toBeNull();

    // saveReminderNotificationSettings がスタブで呼び出され、更新された設定が正常に保存されることを確認する
    expect(mockSaveReminderNotificationSettings).toHaveBeenCalledTimes(1);
    expect(mockSaveReminderNotificationSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderSettingId: 'reminder-001',
        reporterId: 'reporter-001',
        enabledFlag: true,
        sendingTime: '14:30',
        sendingDaysOfWeek: [1, 2, 3, 4, 5, 6],
        deliveryMethod: 'email',
      })
    );
  });
});
