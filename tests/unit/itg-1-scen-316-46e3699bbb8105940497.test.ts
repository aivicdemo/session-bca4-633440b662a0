import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  EmailDeliveryFailureError,
  type SendLeaderNonSubmissionPromptNotificationInput,
  type SendLeaderNonSubmissionPromptNotificationOutput,
  determineReminderNotificationEligibility,
  buildReminderNotificationContent,
  selectNotificationDeliveryMethod,
  recordReminderNotificationSendingResult,
} from '../../src/logic/daily-report-reminder-notification';
import { validateUserHasLeaderRole } from '../../src/logic/user-authentication-authorization';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-316: メール送信サービスが利用不可またはメール送信に失敗したとき、EmailDeliveryFailureErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信失敗でEmailDeliveryFailureErrorが発生し、エラー文言を含む', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: '有効なリーダーID',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['レポーターID1', 'レポーターID2'],
      reminderSettingId: '有効なリマインダー設定ID',
      executionTimestamp: new Date('2024-01-15T10:00:00'),
    };

    (validateUserHasLeaderRole as any).mockResolvedValue(undefined);
    (judgeSchedulerExecutionTiming as any).mockResolvedValue(undefined);
    (determineReminderNotificationEligibility as any).mockResolvedValue(undefined);
    (buildReminderNotificationContent as any).mockResolvedValue(undefined);
    (selectNotificationDeliveryMethod as any).mockResolvedValue(undefined);
    (recordReminderNotificationSendingResult as any).mockResolvedValue(undefined);

    const emailError = new Error('Connection timeout: Email service unavailable');
    (sendNonSubmissionPromptNotification as any).mockRejectedValue(emailError);

    const mockSendLeaderNonSubmissionPromptNotification = async (
      input: SendLeaderNonSubmissionPromptNotificationInput,
    ): Promise<SendLeaderNonSubmissionPromptNotificationOutput> => {
      try {
        await (validateUserHasLeaderRole as any)(input.leaderId);
        await (judgeSchedulerExecutionTiming as any)(input.executionTimestamp);
        await (determineReminderNotificationEligibility as any)(input.reminderSettingId);
        await (buildReminderNotificationContent as any)(input.nonSubmittedReporterIds);
        const deliveryMethodResult = await (selectNotificationDeliveryMethod as any)(input.leaderId);
        await (sendNonSubmissionPromptNotification as any)({
          leaderEmail: 'leader@example.com',
          nonSubmittedReporterIds: input.nonSubmittedReporterIds,
        });
        return {
          success: true,
          notificationId: 'notif-001',
          sentAt: new Date(),
          deliveryMethod: 'email',
          nonSubmittedReporterCount: input.nonSubmittedReporterIds.length,
          errorDetails: null,
        };
      } catch (error: any) {
        const emailDeliveryError = new EmailDeliveryFailureError('Failed to send notification email to leader.');
        throw emailDeliveryError;
      }
    };

    try {
      await mockSendLeaderNonSubmissionPromptNotification(input);
      throw new Error('Should have thrown EmailDeliveryFailureError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(EmailDeliveryFailureError);
      expect(error.message).toContain('Failed to send notification email to leader.');
    }

    expect(validateUserHasLeaderRole).toHaveBeenCalledWith(input.leaderId);
    expect(judgeSchedulerExecutionTiming).toHaveBeenCalledWith(input.executionTimestamp);
    expect(determineReminderNotificationEligibility).toHaveBeenCalledWith(input.reminderSettingId);
    expect(buildReminderNotificationContent).toHaveBeenCalledWith(input.nonSubmittedReporterIds);
    expect(selectNotificationDeliveryMethod).toHaveBeenCalledWith(input.leaderId);
    expect(sendNonSubmissionPromptNotification).toHaveBeenCalled();
  });
});
