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

describe('SCEN-318: チームリーダーが報告者のリマインダー通知を新規登録し、設定が保存される', () => {
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
    mockRetrieveReminderNotificationSettingsByUserId.mockResolvedValue(null);
  });

  it('チームリーダーが報告者『valid-reporter-001』に対してリマインダー通知を新規登録したとき、success=true、新規発行された reminderSettingId（null でない UUID）、operation=\'register\'、appliedAt=操作実行日時、errorDetails=null が返却され、設定内容が保存永続化レイヤーの saveReminderNotificationSettings に正確に渡される', async () => {
    // 入力値を構築
    const now = new Date();
    const input: ManageReminderNotificationSettingsInput = {
      operation: 'register',
      reporterId: 'valid-reporter-001',
      reminderSettingId: null,
      enabledFlag: true,
      sendingTime: '09:00',
      sendingDaysOfWeek: [1, 2, 3, 4, 5],
      deliveryMethod: 'email',
      executionTimestamp: now,
    };

    // manageReminderNotificationSettings を呼び出す
    const result = await manageReminderNotificationSettings(input);

    // 戻り値の success フィールドが true であることを確認する
    expect(result.success).toBe(true);

    // 戻り値の reminderSettingId が null でない UUID 形式の文字列であることを確認する
    expect(result.reminderSettingId).not.toBeNull();
    expect(typeof result.reminderSettingId).toBe('string');
    // UUID 形式のチェック（ハイフン区切りで8-4-4-4-12の形式）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(result.reminderSettingId).toMatch(uuidRegex);

    // 戻り値の operation フィールドが 'register' であることを確認する
    expect(result.operation).toBe('register');

    // 戻り値の appliedAt が実行日時付近の Date オブジェクトであることを確認する
    expect(result.appliedAt).not.toBeNull();
    expect(result.appliedAt instanceof Date).toBe(true);
    // 実行日時との差分が1秒以内であることを確認
    const timeDiff = Math.abs((result.appliedAt as Date).getTime() - now.getTime());
    expect(timeDiff).toBeLessThan(1000);

    // 戻り値の errorDetails フィールドが null であることを確認する
    expect(result.errorDetails).toBeNull();

    // スタブの saveReminderNotificationSettings が、登録済みの reminderSettingId、reporterId、enabledFlag=true、
    // sendingTime='09:00'、sendingDaysOfWeek=[1,2,3,4,5]、deliveryMethod='email' を引数として正確に 1 回呼び出されたことを検証する
    expect(mockSaveReminderNotificationSettings).toHaveBeenCalledTimes(1);
    expect(mockSaveReminderNotificationSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderSettingId: result.reminderSettingId,
        reporterId: 'valid-reporter-001',
        enabledFlag: true,
        sendingTime: '09:00',
        sendingDaysOfWeek: [1, 2, 3, 4, 5],
        deliveryMethod: 'email',
      })
    );
  });
});
