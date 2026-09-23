import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  manageReminderNotificationSettings,
  ManageReminderNotificationSettingsInput,
  ManageReminderNotificationSettingsOutput,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveReminderNotificationSettings: jest.fn(),
  retrieveReminderNotificationSettingsByUserId: jest.fn(),
}));

describe('SCEN-319: チームリーダーが既存の報告者リマインダー設定を更新し、変更内容が保存される', () => {
  let mockSaveReminderNotificationSettings: jest.Mock;
  let mockRetrieveReminderNotificationSettingsByUserId: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveReminderNotificationSettings = require('../../src/logic/user-master-persistence.ts')
      .saveReminderNotificationSettings as jest.Mock;
    mockRetrieveReminderNotificationSettingsByUserId = require('../../src/logic/user-master-persistence.ts')
      .retrieveReminderNotificationSettingsByUserId as jest.Mock;

    // @ts-ignore
    mockSaveReminderNotificationSettings.mockResolvedValue({ success: true });
    // @ts-ignore
    mockRetrieveReminderNotificationSettingsByUserId.mockResolvedValue({
      reminderSettingId: 'reminder-001',
      reporterId: 'reporter-001',
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
    });
  });

  it('出力型 ManageReminderNotificationSettingsOutput のフィールドが以下の値で返却される: success=true、reminderSettingId=\'reminder-001\'（同一ID）、operation=\'update\'、appliedAt=実行時刻の日時オブジェクト（null でない）、errorDetails=null。送信時刻が \'09:00\' から \'14:30\' に、送信曜日が [1,2,3,4,5] から [1,2,3,4,5,6] に変更され、enabledFlag と deliveryMethod は変更前と同じ値で保持される', async () => {
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
    const retrievedSettings = await require('../../src/logic/user-master-persistence.ts')
      .retrieveReminderNotificationSettingsByUserId('reporter-001');
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
    const result = await manageReminderNotificationSettings(input);

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
    // 実行日時との差分が1秒以内であることを確認
    const timeDiff = Math.abs((result.appliedAt as Date).getTime() - now.getTime());
    expect(timeDiff).toBeLessThan(1000);

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
