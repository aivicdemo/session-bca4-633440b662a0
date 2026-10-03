import { sendReporterReminderNotification } from '../../src/logic/daily-report-reminder-notification';
import * as emailNotification from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendDailyReportSubmissionNotification: jest.fn(),
}));

describe('SCEN-296: リマインダー送信条件をすべて満たし、通知内容を構築して配信方法を選択し、メール送信に成功し、送信結果を記録できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (emailNotification.sendDailyReportSubmissionNotification as jest.Mock).mockResolvedValue({
      notificationId: 'notif-12345',
      sentAt: new Date('2024-01-15T09:00:30Z'),
      deliveryMethod: 'email',
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

    expect(emailNotification.sendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
  });
});
