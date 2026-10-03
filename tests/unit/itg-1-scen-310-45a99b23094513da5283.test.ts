import { sendLeaderSubmissionNotification, EmailDeliveryFailureError } from '../../src/logic/daily-report-reminder-notification';
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

describe('SCEN-310: メール送信サービスが利用不可、またはリーダーのメールアドレスが無効である場合、EmailDeliveryFailureErrorが発生する', () => {
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

    jest.spyOn(emailNotificationModule, 'sendDailyReportSubmissionNotification').mockRejectedValue(
      new EmailDeliveryFailureError('メール送信に失敗しました。後で再試行してください。')
    );
  });

  test('メール送信失敗時、success=false で返す', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
      executionTimestamp: new Date('2024-01-15T09:35:00Z'),
    };

    const result = await sendLeaderSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
  });

  test('エラー詳細に「メール送信に失敗しました。後で再試行してください。」を含む', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
      executionTimestamp: new Date('2024-01-15T09:35:00Z'),
    };

    const result = await sendLeaderSubmissionNotification(input);

    expect(result.errorDetails).toBe('メール送信に失敗しました。後で再試行してください。');
  });

  test('出力型の全フィールドを確認', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
      executionTimestamp: new Date('2024-01-15T09:35:00Z'),
    };

    const result = await sendLeaderSubmissionNotification(input);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('notificationId');
    expect(result).toHaveProperty('sentAt');
    expect(result).toHaveProperty('deliveryMethod');
    expect(result).toHaveProperty('errorDetails');
  });
});
