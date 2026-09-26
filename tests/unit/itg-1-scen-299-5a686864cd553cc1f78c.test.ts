import { sendReporterReminderNotification } from '../../src/logic/daily-report-reminder-notification';
import { determineReminderNotificationEligibility } from '../../src/logic/daily-report-reminder-notification';
import { buildReminderNotificationContent } from '../../src/logic/daily-report-reminder-notification';
import { selectNotificationDeliveryMethod } from '../../src/logic/daily-report-reminder-notification';
import { recordReminderNotificationSendingResult } from '../../src/logic/daily-report-reminder-notification';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');

const mockedDetermineReminderNotificationEligibility =
  determineReminderNotificationEligibility as jest.MockedFunction<typeof determineReminderNotificationEligibility>;
const mockedBuildReminderNotificationContent =
  buildReminderNotificationContent as jest.MockedFunction<typeof buildReminderNotificationContent>;
const mockedSelectNotificationDeliveryMethod =
  selectNotificationDeliveryMethod as jest.MockedFunction<typeof selectNotificationDeliveryMethod>;
const mockedSendDailyReportSubmissionNotification =
  sendDailyReportSubmissionNotification as jest.MockedFunction<typeof sendDailyReportSubmissionNotification>;
const mockedRecordReminderNotificationSendingResult =
  recordReminderNotificationSendingResult as jest.MockedFunction<typeof recordReminderNotificationSendingResult>;

describe('SCEN-299: 報告者のメールアドレスが無効または配信方法の選択に失敗した場合、リマインダー通知の送信を中止する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedDetermineReminderNotificationEligibility.mockResolvedValue({
      isEligible: true,
      notificationType: 'reporter_reminder',
      reporterId: 'reporter-001',
      evaluatedAt: new Date('2024-01-15T09:00:00Z'),
    });

    mockedBuildReminderNotificationContent.mockResolvedValue({
      subject: '日報提出のお願い',
      body: '本日の日報入力をお願いします',
      notificationType: 'reporter_reminder',
      generatedAt: new Date('2024-01-15T09:00:00Z'),
    });

    mockedSelectNotificationDeliveryMethod.mockRejectedValue(
      new Error('通知配信方法の選択に失敗しました。')
    );
  });

  it('配信方法選択失敗時: リマインダー通知の送信を中止する', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(sendReporterReminderNotification(input)).rejects.toThrow(
      '通知配信方法の選択に失敗しました。'
    );

    expect(mockedDetermineReminderNotificationEligibility).toHaveBeenCalledTimes(1);
    expect(mockedBuildReminderNotificationContent).toHaveBeenCalledTimes(1);
    expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledTimes(1);
    expect(mockedSendDailyReportSubmissionNotification).not.toHaveBeenCalled();
    expect(mockedRecordReminderNotificationSendingResult).not.toHaveBeenCalled();
  });
});
