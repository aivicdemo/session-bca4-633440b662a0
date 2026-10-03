import { sendReporterReminderNotification } from '../../src/logic/daily-report-reminder-notification';
import * as emailNotification from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendDailyReportSubmissionNotification: jest.fn(),
}));

describe('SCEN-300: メール送信処理に失敗した場合、リマインダー通知の送信を中止する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (emailNotification.sendDailyReportSubmissionNotification as jest.Mock).mockRejectedValue(
      new Error('リマインダー通知の送信に失敗しました。')
    );
  });

  it('メール送信失敗時: リマインダー通知の送信を中止する', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-15'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T14:30:00Z'),
    };

    const result = await sendReporterReminderNotification(input);

    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('リマインダー通知の送信に失敗しました。');

    expect(emailNotification.sendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
  });
});
