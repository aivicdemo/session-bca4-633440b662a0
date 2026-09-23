import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendReporterReminderNotification,
  SendReporterReminderNotificationInput,
  SendReporterReminderNotificationOutput,
  selectNotificationDeliveryMethod,
  InvalidReporterIdError,
} from '../../src/logic/daily-report-reminder-notification';

// 依存先のモック
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-303: チームメンバーIDが空または不正な形式のとき、日次リセット処理を拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reporterId が空文字列のとき、success: false とエラーメッセージを返す', async () => {
    // 入力値を構築
    const input: SendReporterReminderNotificationInput = {
      reporterId: '',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'reminder-001',
      executionTimestamp: new Date(),
    };

    // スタブ設定：selectNotificationDeliveryMethod が空の reporterId でエラーをスロー
    jest.mocked(selectNotificationDeliveryMethod).mockRejectedValue(
      new InvalidReporterIdError('チームメンバー情報が不正です。管理者に確認してください。')
    );

    // テスト対象処理を呼び出し
    jest.mocked(sendReporterReminderNotification).mockResolvedValue({
      success: false,
      notificationId: null,
      sentAt: null,
      deliveryMethod: null,
      errorDetails: 'チームメンバー情報が不正です。管理者に確認してください。',
    } as SendReporterReminderNotificationOutput);

    const result = await sendReporterReminderNotification(input);

    // 期待結果を検証
    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('チームメンバー情報が不正です。管理者に確認してください。');
  });

  it('reporterId が不正な形式（特殊文字のみ）のとき、success: false とエラーメッセージを返す', async () => {
    // 入力値を構築：reporterId に特殊文字のみを設定
    const input: SendReporterReminderNotificationInput = {
      reporterId: '!@#$%',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'reminder-001',
      executionTimestamp: new Date(),
    };

    // スタブ設定：selectNotificationDeliveryMethod が不正な形式の reporterId でエラーをスロー
    jest.mocked(selectNotificationDeliveryMethod).mockRejectedValue(
      new InvalidReporterIdError('チームメンバー情報が不正です。管理者に確認してください。')
    );

    // テスト対象処理を呼び出し
    jest.mocked(sendReporterReminderNotification).mockResolvedValue({
      success: false,
      notificationId: null,
      sentAt: null,
      deliveryMethod: null,
      errorDetails: 'チームメンバー情報が不正です。管理者に確認してください。',
    } as SendReporterReminderNotificationOutput);

    const result = await sendReporterReminderNotification(input);

    // 期待結果を検証
    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('チームメンバー情報が不正です。管理者に確認してください。');
  });

  it('reporterId が制御文字を含むとき、success: false とエラーメッセージを返す', async () => {
    // 入力値を構築：reporterId に制御文字を含む
    const input: SendReporterReminderNotificationInput = {
      reporterId: 'user\x00\x01\x02',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'reminder-001',
      executionTimestamp: new Date(),
    };

    // スタブ設定：selectNotificationDeliveryMethod が制御文字を含む reporterId でエラーをスロー
    jest.mocked(selectNotificationDeliveryMethod).mockRejectedValue(
      new InvalidReporterIdError('チームメンバー情報が不正です。管理者に確認してください。')
    );

    // テスト対象処理を呼び出し
    jest.mocked(sendReporterReminderNotification).mockResolvedValue({
      success: false,
      notificationId: null,
      sentAt: null,
      deliveryMethod: null,
      errorDetails: 'チームメンバー情報が不正です。管理者に確認してください。',
    } as SendReporterReminderNotificationOutput);

    const result = await sendReporterReminderNotification(input);

    // 期待結果を検証
    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('チームメンバー情報が不正です。管理者に確認してください。');
  });
});
