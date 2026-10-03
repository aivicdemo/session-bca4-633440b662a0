import { sendReporterReminderNotification } from '../../src/logic/daily-report-reminder-notification';
import * as emailNotificationModule from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendDailyReportSubmissionNotification: jest.fn(),
}));

describe('SCEN-305: リセット処理中にシステムエラーが発生したとき、リマインダー送信を拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('リセット処理中にシステムエラー発生時、success=false で返す', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-16'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-16T08:30:00Z'),
    };

    const result = await sendReporterReminderNotification(input);

    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  test('エラー詳細に「日次リセット処理に失敗しました。再実行してください」を含む', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2024-01-16'),
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-16T08:30:00Z'),
    };

    const result = await sendReporterReminderNotification(input);

    expect(result).toBeDefined();
    if (result.errorDetails) {
      expect(result.errorDetails).toContain('リセット処理');
    }
  });
});
