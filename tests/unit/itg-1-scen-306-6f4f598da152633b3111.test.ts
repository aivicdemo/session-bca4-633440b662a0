import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as dailyReportPersistenceModule from '../../src/logic/daily-report-persistence';
import * as emailNotificationModule from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  validateUserHasLeaderRole: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));

jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendDailyReportSubmissionNotification: jest.fn(),
}));

describe('SCEN-306: 報告者が日報を提出し、リーダーへの通知が正常に送信される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(userAuthModule, 'validateUserHasLeaderRole').mockResolvedValue({
      hasLeaderRole: true,
      userId: 'leader-001',
    });

    jest.spyOn(dailyReportPersistenceModule, 'retrieveDailyReportsForLeaderReview').mockResolvedValue({
      dailyReports: [
        {
          dailyReportId: 'report-001',
          userId: 'reporter-001',
          reportDate: '2024-01-15',
          submittedAt: '2024-01-15T09:30:00Z',
          businessContent: 'Sample report content',
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      retrievedAt: '2024-01-15T09:31:00Z',
    });

    jest.spyOn(emailNotificationModule, 'sendDailyReportSubmissionNotification').mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'notif-12345',
      sentAt: '2024-01-15T09:31:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  test('reporterId="reporter-001", leaderId="leader-001", targetDate=2024-01-15 の日報提出に対して、リーダーへのメール通知が正常に送信される', async () => {
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
  });

});
