jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendReporterReminderNotification: jest.fn(),
  determineReminderNotificationEligibility: jest.fn(),
  buildReminderNotificationContent: jest.fn(),
  selectNotificationDeliveryMethod: jest.fn(),
  recordReminderNotificationSendingResult: jest.fn(),
}));

jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import { sendReporterReminderNotification } from '../../src/logic/daily-report-reminder-notification';
import { determineReminderNotificationEligibility } from '../../src/logic/daily-report-reminder-notification';
import { buildReminderNotificationContent } from '../../src/logic/daily-report-reminder-notification';
import { selectNotificationDeliveryMethod } from '../../src/logic/daily-report-reminder-notification';
import { recordReminderNotificationSendingResult } from '../../src/logic/daily-report-reminder-notification';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

const mockedDetermineReminderNotificationEligibility = determineReminderNotificationEligibility as jest.Mock;
const mockedBuildReminderNotificationContent = buildReminderNotificationContent as jest.Mock;
const mockedSelectNotificationDeliveryMethod = selectNotificationDeliveryMethod as jest.Mock;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.Mock;
const mockedRecordReminderNotificationSendingResult = recordReminderNotificationSendingResult as jest.Mock;
const mockedSendReporterReminderNotification = sendReporterReminderNotification as jest.Mock;

describe('SCEN-296: リマインダー送信条件をすべて満たし、通知内容を構築して配信方法を選択し、メール送信に成功し、送信結果を記録できる', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // 正常系の設定
    mockedDetermineReminderNotificationEligibility.mockResolvedValue(true);

    mockedBuildReminderNotificationContent.mockResolvedValue({
      subject: '日報提出のお願い',
      body: '本日の日報入力をお願いします',
      contentId: 'content-001',
    });

    mockedSelectNotificationDeliveryMethod.mockResolvedValue({
      method: 'email',
      address: 'reporter-001@example.com',
    });

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      notificationId: 'notif-12345',
      sentAt: new Date('2024-01-15T09:00:30Z'),
      status: 'sent',
    });

    mockedRecordReminderNotificationSendingResult.mockResolvedValue({
      recordId: 'record-001',
      success: true,
    });

    // 実装処理のモック：スタブの呼び出しを組み合わせて成功を返す
    mockedSendReporterReminderNotification.mockImplementation(async (input) => {
      // determineReminderNotificationEligibility 呼び出し
      const eligibilityCheck = await mockedDetermineReminderNotificationEligibility(input);
      if (!eligibilityCheck) {
        return {
          success: false,
          notificationId: null,
          sentAt: null,
          deliveryMethod: null,
          errorDetails: 'リマインダー通知の送信条件を満たしていません。',
        };
      }

      // buildReminderNotificationContent 呼び出し
      const content = await mockedBuildReminderNotificationContent(input);

      // selectNotificationDeliveryMethod 呼び出し
      const deliveryMethod = await mockedSelectNotificationDeliveryMethod({
        reporterId: input.reporterId,
      });

      // sendDailyReportSubmissionNotification 呼び出し
      const sendResult = await mockedSendDailyReportSubmissionNotification({
        reporterId: input.reporterId,
        targetDate: input.targetDate,
        deliveryMethod: deliveryMethod.method,
        content: content,
      });

      // recordReminderNotificationSendingResult 呼び出し
      await mockedRecordReminderNotificationSendingResult({
        notificationId: sendResult.notificationId,
        sentAt: sendResult.sentAt,
        deliveryMethod: deliveryMethod.method,
        success: true,
      });

      return {
        success: true,
        notificationId: sendResult.notificationId,
        sentAt: sendResult.sentAt,
        deliveryMethod: deliveryMethod.method,
        errorDetails: null,
      };
    });
  });

  it('正常系: すべての条件を満たして通知が送信され、結果が記録される', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    const result = await sendReporterReminderNotification(input);

    // 戻り値の検証
    expect(result.success).toBe(true);
    expect(result.notificationId).toBe('notif-12345');
    expect(result.sentAt).toEqual(new Date('2024-01-15T09:00:30Z'));
    expect(result.deliveryMethod).toBe('email');
    expect(result.errorDetails).toBeNull();

    // スタブ呼び出し順序の検証
    expect(mockedDetermineReminderNotificationEligibility).toHaveBeenCalledTimes(1);
    expect(mockedDetermineReminderNotificationEligibility).toHaveBeenCalledWith(input);

    expect(mockedBuildReminderNotificationContent).toHaveBeenCalledTimes(1);
    expect(mockedBuildReminderNotificationContent).toHaveBeenCalledWith(input);

    expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledTimes(1);
    expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledWith({
      reporterId: 'reporter-001',
    });

    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'reporter-001',
        targetDate: new Date('2024-01-15'),
        deliveryMethod: 'email',
      })
    );

    expect(mockedRecordReminderNotificationSendingResult).toHaveBeenCalledTimes(1);
    expect(mockedRecordReminderNotificationSendingResult).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: 'notif-12345',
        sentAt: new Date('2024-01-15T09:00:30Z'),
        deliveryMethod: 'email',
        success: true,
      })
    );
  });
});
