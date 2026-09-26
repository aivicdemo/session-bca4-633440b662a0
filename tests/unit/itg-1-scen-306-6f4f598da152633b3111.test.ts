import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';
import {
  buildReminderNotificationContent,
  selectNotificationDeliveryMethod,
  recordReminderNotificationSendingResult,
} from '../../src/logic/daily-report-reminder-notification';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');

const mockedBuildReminderNotificationContent =
  buildReminderNotificationContent as jest.MockedFunction<typeof buildReminderNotificationContent>;
const mockedSelectNotificationDeliveryMethod =
  selectNotificationDeliveryMethod as jest.MockedFunction<typeof selectNotificationDeliveryMethod>;
const mockedRecordReminderNotificationSendingResult =
  recordReminderNotificationSendingResult as jest.MockedFunction<typeof recordReminderNotificationSendingResult>;
const mockedSendDailyReportSubmissionNotification =
  sendDailyReportSubmissionNotification as jest.MockedFunction<typeof sendDailyReportSubmissionNotification>;

describe('SCEN-306: 報告者が日報を提出し、リーダーへの通知が正常に送信される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedBuildReminderNotificationContent.mockResolvedValue({
      subject: '日報提出のお知らせ',
      body: '報告者による日報が提出されました。',
      notificationType: 'leader_submission',
      generatedAt: new Date('2024-01-15T09:31:00Z'),
    });

    mockedSelectNotificationDeliveryMethod.mockResolvedValue({
      deliveryMethod: 'email',
      isDeliveryEnabled: true,
      selectedAt: new Date('2024-01-15T09:31:00Z'),
    });

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      success: true,
      emailSendingHistoryId: null,
      sentAt: '2024-01-15T09:31:05Z',
      errorMessage: null,
      adminNotificationSent: true,
    });

    mockedRecordReminderNotificationSendingResult.mockResolvedValue({
      success: true,
      detectionLogId: null,
      notificationStatus: 'sent',
      recordedAt: new Date('2024-01-15T09:31:05Z'),
    });
  });

  it('reporterId="reporter-001", leaderId="leader-001", targetDate=2024-01-15 の日報提出に対して、リーダーへのメール通知が正常に送信される', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
      executionTimestamp: new Date('2024-01-15T09:31:00Z'),
    };

    const result = await sendLeaderSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.notificationId).toBe('notif-12345');
    expect(result.sentAt).toEqual(new Date('2024-01-15T09:31:05Z'));
    expect(result.deliveryMethod).toBe('email');
    expect(result.errorDetails).toBeNull();

    expect(mockedBuildReminderNotificationContent).toHaveBeenCalledTimes(1);
    expect(mockedSelectNotificationDeliveryMethod).toHaveBeenCalledTimes(1);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
    expect(mockedRecordReminderNotificationSendingResult).toHaveBeenCalledTimes(1);
  });
});
