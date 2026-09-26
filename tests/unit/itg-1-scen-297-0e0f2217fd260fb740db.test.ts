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

describe('SCEN-297: リマインダー設定が無効、送信時刻が未到来、または対象報告者が非アクティブな場合、リマインダー通知の送信を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedDetermineReminderNotificationEligibility.mockResolvedValue({
      isEligible: false,
      notificationType: 'reporter_reminder',
      reporterId: 'reporter-001',
      ineligibilityReason: 'リマインダー通知の送信条件を満たしていません。',
      evaluatedAt: new Date('2025-01-14T16:00:00Z'),
    });
  });

  it('適格性チェック失敗時: リマインダー通知の送信を拒否する', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2025-01-15'),
      reminderSettingId: 'setting-invalid-or-inactive',
      executionTimestamp: new Date('2025-01-14T16:00:00Z'),
    };

    await expect(sendReporterReminderNotification(input)).rejects.toThrow();
  });
});
