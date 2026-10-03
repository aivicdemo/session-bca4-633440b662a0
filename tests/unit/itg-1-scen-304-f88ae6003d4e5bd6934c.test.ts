import { sendReporterReminderNotification } from '../../src/logic/daily-report-reminder-notification';
import * as emailNotificationModule from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendDailyReportSubmissionNotification: jest.fn(),
}));

describe('SCEN-304: 前日の日報データが破損または取得できないとき、リマインダー送信を拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('前日の日報データが null のとき、エラーをスロー', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-16'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-16T08:30:00Z'),
    };

    await expect(
      sendReporterReminderNotification(input)
    ).rejects.toThrow();
  });

  test('前日の日報データが undefined のとき、エラーをスロー', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-16'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-16T08:30:00Z'),
    };

    await expect(
      sendReporterReminderNotification(input)
    ).rejects.toThrow();
  });

});
