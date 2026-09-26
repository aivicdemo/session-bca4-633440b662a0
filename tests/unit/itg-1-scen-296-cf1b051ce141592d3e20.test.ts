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

describe('SCEN-296: リマインダー送信条件をすべて満たし、通知内容を構築して配信方法を選択し、メール送信に成功し、送信結果を記録できる', () => {
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

    mockedSelectNotificationDeliveryMethod.mockResolvedValue({
      deliveryMethod: 'email',
      isDeliveryEnabled: true,
      selectedAt: new Date('2024-01-15T09:00:00Z'),
    });

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      success: true,
      emailSendingHistoryId: null,
      sentAt: '2024-01-15T09:00:30Z',
      errorMessage: null,
      adminNotificationSent: true,
    });

    mockedRecordReminderNotificationSendingResult.mockResolvedValue({
      success: true,
      detectionLogId: null,
      notificationStatus: 'sent',
      recordedAt: new Date('2024-01-15T09:00:30Z'),
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

    expect(result.success).toBe(true);
    expect(result.notificationId).toBe('notif-12345');
    expect(result.sentAt).toEqual(new Date('2024-01-15T09:00:30Z'));
    expect(result.deliveryMethod).toBe('email');
    expect(result.errorDetails).toBeNull();

    expect(mockedDetermineReminderNotificationEligibility).toHaveBeenCalledTimes(1);
    expect(mockedDetermineReminderNotificationEligibility).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationType: 'reporter_reminder',
        reporterId: 'reporter-001',
        reminderSettingId: 'setting-001',
        targetDate: new Date('2024-01-15'),
        executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      })
    );

    expect(mockedBuildReminderNotificationContent).toHaveBeenCalledTimes(1);

    expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledTimes(1);

    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);

    expect(mockedRecordReminderNotificationSendingResult).toHaveBeenCalledTimes(1);
  });
});
