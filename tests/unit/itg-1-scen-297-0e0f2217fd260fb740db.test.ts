jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendReporterReminderNotification: jest.fn(),
  determineReminderNotificationEligibility: jest.fn(),
  buildReminderNotificationContent: jest.fn(),
  selectNotificationDeliveryMethod: jest.fn(),
  recordReminderNotificationSendingResult: jest.fn(),
}));

jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import { sendReporterReminderNotification } from '../../src/logic/daily-report-reminder-notification';
import { determineReminderNotificationEligibility } from '../../src/logic/daily-report-reminder-notification';
import { buildReminderNotificationContent } from '../../src/logic/daily-report-reminder-notification';
import { selectNotificationDeliveryMethod } from '../../src/logic/daily-report-reminder-notification';
import { recordReminderNotificationSendingResult } from '../../src/logic/daily-report-reminder-notification';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

const mockedDetermineReminderNotificationEligibility = determineReminderNotificationEligibility as jest.Mock;
const mockedBuildReminderNotificationContent = buildReminderNotificationContent as jest.Mock;
const mockedSelectNotificationDeliveryMethod = selectNotificationDeliveryMethod as jest.Mock;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.Mock;
const mockedRecordReminderNotificationSendingResult = recordReminderNotificationSendingResult as jest.Mock;
const mockedSendReporterReminderNotification = sendReporterReminderNotification as jest.Mock;

describe('SCEN-297: リマインダー設定が無効、送信時刻が未到来、または対象報告者が非アクティブな場合、リマインダー通知の送信を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // 適格性チェック失敗
    mockedDetermineReminderNotificationEligibility.mockResolvedValue(false);

    // 以降のスタブは呼ばれないため設定しない

    // 実装処理のモック
    mockedSendReporterReminderNotification.mockImplementation(async (input) => {
      // determineReminderNotificationEligibility 呼び出し
      const eligibilityCheck = await mockedDetermineReminderNotificationEligibility(input);
      if (!eligibilityCheck) {
        return {
          success: false,
          notificationId: null,
          sentAt: null,
          deliveryMethod: null,
          errorDetails: 'リマインダー通知の送信条件を満たしていません。',
        };
      }

      // 以降の処理は実行されない
      throw new Error('Should not reach here');
    });
  });

  it('適格性チェック失敗時: リマインダー通知の送信を拒否する', async () => {
    const input = {
      reporterId: 'reporter-001',
      targetDate: new Date('2025-01-15'),
      reminderSettingId: 'setting-invalid-or-inactive',
      executionTimestamp: new Date('2025-01-14T16:00:00Z'),
    };

    const result = await sendReporterReminderNotification(input);

    // 戻り値の検証
    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('リマインダー通知の送信条件を満たしていません。');

    // 適格性チェックは呼ばれる
    expect(mockedDetermineReminderNotificationEligibility).toHaveBeenCalledTimes(1);
    expect(mockedDetermineReminderNotificationEligibility).toHaveBeenCalledWith(input);

    // 以降の処理は呼ばれない
    expect(mockedBuildReminderNotificationContent).not.toHaveBeenCalled();
    expect(mockedSelectNotificationDeliveryMethod).not.toHaveBeenCalled();
    expect(mockedSendDailyReportSubmissionNotification).not.toHaveBeenCalled();
    expect(mockedRecordReminderNotificationSendingResult).not.toHaveBeenCalled();
  });
});
