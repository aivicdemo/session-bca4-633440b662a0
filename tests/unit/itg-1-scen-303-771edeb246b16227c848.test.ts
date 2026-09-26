import {
  sendReporterReminderNotification,
  selectNotificationDeliveryMethod,
  type SendReporterReminderNotificationInput,
  type SendReporterReminderNotificationOutput,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/daily-report-reminder-notification', () => {
  const actual = jest.requireActual('../../src/logic/daily-report-reminder-notification');
  return {
    ...actual,
    selectNotificationDeliveryMethod: jest.fn(),
  };
});

const mockedSelectNotificationDeliveryMethod = selectNotificationDeliveryMethod as jest.MockedFunction<typeof selectNotificationDeliveryMethod>;

describe('SCEN-303: チームメンバーIDが空または不正な形式のとき、日次リセット処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('reporterId が空文字列のとき', () => {
    it('selectNotificationDeliveryMethod がエラーをスロー、sendReporterReminderNotification は success: false、errorDetails: "チームメンバー情報が不正です。管理者に確認してください" を返す', async () => {
      const input: SendReporterReminderNotificationInput = {
        reporterId: '',
        targetDate: new Date('2024-01-15'),
        reminderSettingId: 'reminder-001',
        executionTimestamp: new Date(),
      };

      mockedSelectNotificationDeliveryMethod.mockRejectedValueOnce(
        new Error('チームメンバー情報が不正です。管理者に確認してください')
      );

      const result: SendReporterReminderNotificationOutput = await sendReporterReminderNotification(input);

      expect(result.success).toBe(false);
      expect(result.notificationId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.deliveryMethod).toBeNull();
      expect(result.errorDetails).toBe('チームメンバー情報が不正です。管理者に確認してください');

      expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          reporterId: '',
          reminderSettingId: 'reminder-001',
        })
      );
    });
  });

  describe('reporterId が不正な形式（特殊文字のみ）のとき', () => {
    it('selectNotificationDeliveryMethod がエラーをスロー、sendReporterReminderNotification は success: false、同じエラー詳細メッセージを返す', async () => {
      const input: SendReporterReminderNotificationInput = {
        reporterId: '!!!###@@@',
        targetDate: new Date('2024-01-15'),
        reminderSettingId: 'reminder-001',
        executionTimestamp: new Date(),
      };

      mockedSelectNotificationDeliveryMethod.mockRejectedValueOnce(
        new Error('チームメンバー情報が不正です。管理者に確認してください')
      );

      const result: SendReporterReminderNotificationOutput = await sendReporterReminderNotification(input);

      expect(result.success).toBe(false);
      expect(result.notificationId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.deliveryMethod).toBeNull();
      expect(result.errorDetails).toBe('チームメンバー情報が不正です。管理者に確認してください');

      expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          reporterId: '!!!###@@@',
          reminderSettingId: 'reminder-001',
        })
      );
    });
  });

  describe('reporterId が不正な形式（制御文字を含む）のとき', () => {
    it('selectNotificationDeliveryMethod がエラーをスロー、sendReporterReminderNotification は success: false、同じエラー詳細メッセージを返す', async () => {
      const input: SendReporterReminderNotificationInput = {
        reporterId: 'reporter\x00id\x01with\x02control',
        targetDate: new Date('2024-01-15'),
        reminderSettingId: 'reminder-001',
        executionTimestamp: new Date(),
      };

      mockedSelectNotificationDeliveryMethod.mockRejectedValueOnce(
        new Error('チームメンバー情報が不正です。管理者に確認してください')
      );

      const result: SendReporterReminderNotificationOutput = await sendReporterReminderNotification(input);

      expect(result.success).toBe(false);
      expect(result.notificationId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.deliveryMethod).toBeNull();
      expect(result.errorDetails).toBe('チームメンバー情報が不正です。管理者に確認してください');

      expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          reporterId: 'reporter\x00id\x01with\x02control',
          reminderSettingId: 'reminder-001',
        })
      );
    });
  });
});
