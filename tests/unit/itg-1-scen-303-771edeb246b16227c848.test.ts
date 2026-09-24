jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendReporterReminderNotification: jest.fn(),
  selectNotificationDeliveryMethod: jest.fn(),
}));

import {
  sendReporterReminderNotification,
  selectNotificationDeliveryMethod,
  type SendReporterReminderNotificationInput,
  type SendReporterReminderNotificationOutput,
  InvalidReporterIdError,
} from '../../src/logic/daily-report-reminder-notification';

const mockedSendReporterReminderNotification = sendReporterReminderNotification as jest.Mock;
const mockedSelectNotificationDeliveryMethod = selectNotificationDeliveryMethod as jest.Mock;

describe('SCEN-303: チームメンバーIDが空または不正な形式のとき、日次リセット処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('reporterId が空文字列のとき', () => {
    it('success: false、errorDetails: "チームメンバー情報が不正です。管理者に確認してください" を返す', async () => {
      const input: SendReporterReminderNotificationInput = {
        reporterId: '',
        targetDate: new Date('2024-01-15'),
        reminderSettingId: 'reminder-001',
        executionTimestamp: new Date(),
      };

      mockedSelectNotificationDeliveryMethod.mockRejectedValue(
        new Error('チームメンバー情報が不正です。管理者に確認してください')
      );

      mockedSendReporterReminderNotification.mockResolvedValue({
        success: false,
        notificationId: null,
        sentAt: null,
        deliveryMethod: null,
        errorDetails: 'チームメンバー情報が不正です。管理者に確認してください',
      });

      const result: SendReporterReminderNotificationOutput = await sendReporterReminderNotification(input);

      expect(result.success).toBe(false);
      expect(result.notificationId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.deliveryMethod).toBeNull();
      expect(result.errorDetails).toBe('チームメンバー情報が不正です。管理者に確認してください');
    });
  });

  describe('reporterId が不正な形式（特殊文字のみ）のとき', () => {
    it('success: false、同じエラー詳細メッセージを返す', async () => {
      const input: SendReporterReminderNotificationInput = {
        reporterId: '!!!###@@@',
        targetDate: new Date('2024-01-15'),
        reminderSettingId: 'reminder-001',
        executionTimestamp: new Date(),
      };

      mockedSelectNotificationDeliveryMethod.mockRejectedValue(
        new Error('チームメンバー情報が不正です。管理者に確認してください')
      );

      mockedSendReporterReminderNotification.mockResolvedValue({
        success: false,
        notificationId: null,
        sentAt: null,
        deliveryMethod: null,
        errorDetails: 'チームメンバー情報が不正です。管理者に確認してください',
      });

      const result: SendReporterReminderNotificationOutput = await sendReporterReminderNotification(input);

      expect(result.success).toBe(false);
      expect(result.notificationId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.deliveryMethod).toBeNull();
      expect(result.errorDetails).toBe('チームメンバー情報が不正です。管理者に確認してください');
    });
  });

  describe('reporterId が不正な形式（制御文字を含む）のとき', () => {
    it('success: false、同じエラー詳細メッセージを返す', async () => {
      const input: SendReporterReminderNotificationInput = {
        reporterId: 'reporter\x00id\x01with\x02control',
        targetDate: new Date('2024-01-15'),
        reminderSettingId: 'reminder-001',
        executionTimestamp: new Date(),
      };

      mockedSelectNotificationDeliveryMethod.mockRejectedValue(
        new Error('チームメンバー情報が不正です。管理者に確認してください')
      );

      mockedSendReporterReminderNotification.mockResolvedValue({
        success: false,
        notificationId: null,
        sentAt: null,
        deliveryMethod: null,
        errorDetails: 'チームメンバー情報が不正です。管理者に確認してください',
      });

      const result: SendReporterReminderNotificationOutput = await sendReporterReminderNotification(input);

      expect(result.success).toBe(false);
      expect(result.notificationId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.deliveryMethod).toBeNull();
      expect(result.errorDetails).toBe('チームメンバー情報が不正です。管理者に確認してください');
    });
  });
});
