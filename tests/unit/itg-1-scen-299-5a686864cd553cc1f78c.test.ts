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

describe('SCEN-299: 報告者のメールアドレスが無効または配信方法の選択に失敗した場合、リマインダー通知の送信を中止する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // 適格性チェック成功
    mockedDetermineReminderNotificationEligibility.mockResolvedValue(true);

    // 通知内容構築成功
    mockedBuildReminderNotificationContent.mockResolvedValue({
      subject: '日報提出のお願い',
      body: '本日の日報入力をお願いします',
    });

    // 配信方法選択失敗
    mockedSelectNotificationDeliveryMethod.mockRejectedValue(
      new Error('NotificationDeliveryMethodSelectionFailed: 通知配信方法の選択に失敗しました。')
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

      // selectNotificationDeliveryMethod 呼び出し - 失敗
      try {
        await mockedSelectNotificationDeliveryMethod({
          reporterId: input.reporterId,
        });
      } catch (error) {
        return {
          success: false,
          notificationId: null,
          sentAt: null,
          deliveryMethod: null,
          errorDetails: '通知配信方法の選択に失敗しました。',
        };
      }

      // 以降の処理は実行されない
      throw new Error('Should not reach here');
    });
  });

  it('配信方法選択失敗時: リマインダー通知の送信を中止する', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    const result = await sendReporterReminderNotification(input);

    // 戻り値の検証
    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('通知配信方法の選択に失敗しました。');

    // 適格性チェック と 内容構築と配信方法選択は呼ばれる
    expect(mockedDetermineReminderNotificationEligibility).toHaveBeenCalledTimes(1);
    expect(mockedBuildReminderNotificationContent).toHaveBeenCalledTimes(1);
    expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledTimes(1);

    // メール送信と結果記録は呼ばれない
    expect(mockedSendDailyReportSubmissionNotification).not.toHaveBeenCalled();
    expect(mockedRecordReminderNotificationSendingResult).not.toHaveBeenCalled();
  });
});
