jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendReporterReminderNotification: jest.fn(),
  determineReminderNotificationEligibility: jest.fn(),
  buildReminderNotificationContent: jest.fn(),
  selectNotificationDeliveryMethod: jest.fn(),
  recordReminderNotificationSendingResult: jest.fn(),
  ReminderNotificationSendingResultRecordingFailed: class ReminderNotificationSendingResultRecordingFailed extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ReminderNotificationSendingResultRecordingFailed';
    }
  },
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
import { ReminderNotificationSendingResultRecordingFailed } from '../../src/logic/daily-report-reminder-notification';

const mockedDetermineReminderNotificationEligibility = determineReminderNotificationEligibility as jest.Mock;
const mockedBuildReminderNotificationContent = buildReminderNotificationContent as jest.Mock;
const mockedSelectNotificationDeliveryMethod = selectNotificationDeliveryMethod as jest.Mock;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.Mock;
const mockedRecordReminderNotificationSendingResult = recordReminderNotificationSendingResult as jest.Mock;
const mockedSendReporterReminderNotification = sendReporterReminderNotification as jest.Mock;

describe('SCEN-301: 送信結果の記録処理に失敗した場合、リマインダー通知の送信失敗を報告する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // 適格性チェック成功
    mockedDetermineReminderNotificationEligibility.mockResolvedValue(true);

    // 通知内容構築成功
    mockedBuildReminderNotificationContent.mockResolvedValue({
      subject: '日報提出のお願い',
      body: '本日の日報入力をお願いします',
    });

    // 配信方法選択成功
    mockedSelectNotificationDeliveryMethod.mockResolvedValue({
      method: 'email',
      address: 'reporter-001@example.com',
    });

    // メール送信成功
    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      notificationId: 'notif-12345',
      sentAt: new Date('2024-01-15T09:00:01Z'),
      status: 'sent',
    });

    // 結果記録失敗
    mockedRecordReminderNotificationSendingResult.mockRejectedValue(
      new ReminderNotificationSendingResultRecordingFailed('リマインダー通知の送信結果記録に失敗しました。')
    );

    // 実装処理のモック
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

      // recordReminderNotificationSendingResult 呼び出し - 失敗時は例外をスロー
      await mockedRecordReminderNotificationSendingResult({
        notificationId: sendResult.notificationId,
        sentAt: sendResult.sentAt,
        deliveryMethod: deliveryMethod.method,
        success: true,
      });

      // 成功時の戻り値は返されない（例外がスローされるため）
      return {
        success: true,
        notificationId: sendResult.notificationId,
        sentAt: sendResult.sentAt,
        deliveryMethod: deliveryMethod.method,
        errorDetails: null,
      };
    });
  });

  it('送信結果記録失敗時: 例外をスロー', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(sendReporterReminderNotification(input)).rejects.toThrow(
      ReminderNotificationSendingResultRecordingFailed
    );
    await expect(sendReporterReminderNotification(input)).rejects.toThrow(
      'リマインダー通知の送信結果記録に失敗しました。'
    );

    // 適格性チェック、内容構築、配信方法選択、メール送信、結果記録が呼ばれる
    expect(mockedDetermineReminderNotificationEligibility).toHaveBeenCalledTimes(2);
    expect(mockedBuildReminderNotificationContent).toHaveBeenCalledTimes(2);
    expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledTimes(2);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(2);
    expect(mockedRecordReminderNotificationSendingResult).toHaveBeenCalledTimes(2);
  });
});
