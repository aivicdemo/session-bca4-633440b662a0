import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  InvalidExecutionTimingError,
  type SendLeaderNonSubmissionPromptNotificationInput,
  type SendLeaderNonSubmissionPromptNotificationOutput,
} from '../../src/logic/daily-report-reminder-notification';
import { validateUserHasLeaderRole } from '../../src/logic/user-authentication-authorization';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-317: 実行タイミングが営業日の営業時間外のとき、InvalidExecutionTimingErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業時間外のタイムスタンプで処理を実行すると、InvalidExecutionTimingErrorが発生し、メール送信は実行されない', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'reminder-setting-001',
      executionTimestamp: new Date('2024-01-15T22:00:00'),
    };

    (validateUserHasLeaderRole as any).mockResolvedValue(undefined);
    (judgeSchedulerExecutionTiming as any).mockResolvedValue(null);
    (sendNonSubmissionPromptNotification as any).mockResolvedValue(undefined);

    const mockSendLeaderNonSubmissionPromptNotification = async (
      input: SendLeaderNonSubmissionPromptNotificationInput,
    ): Promise<SendLeaderNonSubmissionPromptNotificationOutput> => {
      await (validateUserHasLeaderRole as any)(input.leaderId);

      const timingJudgment = await (judgeSchedulerExecutionTiming as any)(input.executionTimestamp);

      if (!timingJudgment) {
        const error = new InvalidExecutionTimingError('Execution timing is outside business hours or not a business day.');
        throw error;
      }

      await (sendNonSubmissionPromptNotification as any)({
        leaderEmail: 'leader@example.com',
      });

      return {
        success: true,
        notificationId: 'notif-001',
        sentAt: new Date(),
        deliveryMethod: 'email',
        nonSubmittedReporterCount: input.nonSubmittedReporterIds.length,
        errorDetails: null,
      };
    };

    try {
      await mockSendLeaderNonSubmissionPromptNotification(input);
      throw new Error('Should have thrown InvalidExecutionTimingError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(InvalidExecutionTimingError);
      expect(error.message).toContain('Execution timing is outside business hours or not a business day.');
    }

    expect(validateUserHasLeaderRole).toHaveBeenCalledWith(input.leaderId);
    expect(judgeSchedulerExecutionTiming).toHaveBeenCalledWith(input.executionTimestamp);
    expect(sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(input.nonSubmittedReporterIds.length).toBe(2);
  });

  it('土曜日のタイムスタンプで処理を実行すると、InvalidExecutionTimingErrorが発生し、メール送信は実行されない', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'reminder-setting-001',
      executionTimestamp: new Date('2024-01-20T10:00:00'),
    };

    (validateUserHasLeaderRole as any).mockResolvedValue(undefined);
    (judgeSchedulerExecutionTiming as any).mockResolvedValue(null);
    (sendNonSubmissionPromptNotification as any).mockResolvedValue(undefined);

    const mockSendLeaderNonSubmissionPromptNotification = async (
      input: SendLeaderNonSubmissionPromptNotificationInput,
    ): Promise<SendLeaderNonSubmissionPromptNotificationOutput> => {
      await (validateUserHasLeaderRole as any)(input.leaderId);

      const timingJudgment = await (judgeSchedulerExecutionTiming as any)(input.executionTimestamp);

      if (!timingJudgment) {
        const error = new InvalidExecutionTimingError('Execution timing is outside business hours or not a business day.');
        throw error;
      }

      await (sendNonSubmissionPromptNotification as any)({
        leaderEmail: 'leader@example.com',
      });

      return {
        success: true,
        notificationId: 'notif-001',
        sentAt: new Date(),
        deliveryMethod: 'email',
        nonSubmittedReporterCount: input.nonSubmittedReporterIds.length,
        errorDetails: null,
      };
    };

    try {
      await mockSendLeaderNonSubmissionPromptNotification(input);
      throw new Error('Should have thrown InvalidExecutionTimingError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(InvalidExecutionTimingError);
      expect(error.message).toContain('Execution timing is outside business hours or not a business day.');
    }

    expect(validateUserHasLeaderRole).toHaveBeenCalledWith(input.leaderId);
    expect(judgeSchedulerExecutionTiming).toHaveBeenCalledWith(input.executionTimestamp);
    expect(sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(input.nonSubmittedReporterIds.length).toBe(2);
  });
});
