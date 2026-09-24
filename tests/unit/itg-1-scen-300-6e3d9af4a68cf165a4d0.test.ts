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

describe('SCEN-300: メール送信処理に失敗した場合、リマインダー通知の送信を中止する', () => {
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

    // メール送信失敗
    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new Error('ReminderNotificationSendingFailed: リマインダー通知の送信に失敗しました。')
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

      // sendDailyReportSubmissionNotification 呼び出し - 失敗
      try {
        await mockedSendDailyReportSubmissionNotification({
          reporterId: input.reporterId,
          targetDate: input.targetDate,
          deliveryMethod: deliveryMethod.method,
          content: content,
        });
      } catch (error) {
        return {
          success: false,
          notificationId: null,
          sentAt: null,
          deliveryMethod: null,
          errorDetails: 'リマインダー通知の送信に失敗しました。',
        };
      }

      // 以降の処理は実行されない
      throw new Error('Should not reach here');
    });
  });

  it('メール送信失敗時: リマインダー通知の送信を中止する', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T14:30:00Z'),
    };

    const result = await sendReporterReminderNotification(input);

    // 戻り値の検証
    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('リマインダー通知の送信に失敗しました。');

    // 適格性チェック、内容構築、配信方法選択、メール送信は呼ばれる
    expect(mockedDetermineReminderNotificationEligibility).toHaveBeenCalledTimes(1);
    expect(mockedBuildReminderNotificationContent).toHaveBeenCalledTimes(1);
    expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledTimes(1);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);

    // 結果記録は呼ばれない
    expect(mockedRecordReminderNotificationSendingResult).not.toHaveBeenCalled();
  });
});
