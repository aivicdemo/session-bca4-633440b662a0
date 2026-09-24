jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock('../../src/logic/non-submission-prompt-decision', () => ({
  judgePromptNecessityAndMethod: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));

import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming =
  judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck =
  getActiveReportersForSubmissionCheck as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline =
  detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedJudgePromptNecessityAndMethod =
  judgePromptNecessityAndMethod as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification =
  sendLeaderNonSubmissionPromptNotification as jest.Mock;
const mockedRetrieveNonSubmissionDetectionLogsByDate =
  retrieveNonSubmissionDetectionLogsByDate as jest.Mock;

describe('SCEN-055: 催促メール送信に失敗してもリーダー通知と検知ログ記録は実行され部分失敗で完了する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue([
      {
        userId: 'user1',
        userName: 'User 1',
        reporterName: 'Reporter 1',
      },
      {
        userId: 'user2',
        userName: 'User 2',
        reporterName: 'Reporter 2',
      },
      {
        userId: 'user3',
        userName: 'User 3',
        reporterName: 'Reporter 3',
      },
      {
        userId: 'user4',
        userName: 'User 4',
        reporterName: 'Reporter 4',
      },
      {
        userId: 'user5',
        userName: 'User 5',
        reporterName: 'Reporter 5',
      },
    ]);

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue([
      {
        userId: 'user1',
        userName: 'User 1',
        reporterName: 'Reporter 1',
        targetDate: '2025-01-15',
        detectionTime: '2025-01-15T17:30:00Z',
      },
      {
        userId: 'user2',
        userName: 'User 2',
        reporterName: 'Reporter 2',
        targetDate: '2025-01-15',
        detectionTime: '2025-01-15T17:30:00Z',
      },
    ]);

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      shouldPrompt: true,
      targetReporters: [
        {
          userId: 'user1',
          notificationType: 'email',
        },
        {
          userId: 'user2',
          notificationType: 'email',
        },
      ],
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      status: 'sent',
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      detectionLogId: 'log-20250115-001',
      detections: [
        {
          userId: 'user1',
          userName: 'User 1',
          reporterName: 'Reporter 1',
          targetDate: '2025-01-15',
          detectionTime: '2025-01-15T17:30:00Z',
        },
        {
          userId: 'user2',
          userName: 'User 2',
          reporterName: 'Reporter 2',
          targetDate: '2025-01-15',
          detectionTime: '2025-01-15T17:30:00Z',
        },
      ],
    });
  });

  it('executionStatusは partial_failure である', async () => {
    const mockAiClient: any = {
      sendNonSubmissionAlert: jest.fn().mockRejectedValue(
        Object.assign(
          new Error(
            '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。'
          ),
          { errorCode: 'PromptNotificationSendFailure' }
        )
      ),
    };
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:30:00Z',
          executedBy: 'scheduler-001',
        },
      },
      mockAiClient
    );

    expect(result.executionStatus).toBe('partial_failure');
  });

  it('nonSubmittedReportersに未提出者2名のデータが含まれる', async () => {
    const mockAiClient: any = {
      sendNonSubmissionAlert: jest.fn().mockRejectedValue(
        Object.assign(
          new Error(
            '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。'
          ),
          { errorCode: 'PromptNotificationSendFailure' }
        )
      ),
    };
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:30:00Z',
          executedBy: 'scheduler-001',
        },
      },
      mockAiClient
    );

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: 'user1',
      userName: 'User 1',
      reporterName: 'Reporter 1',
      targetDate: '2025-01-15',
    });
    expect(result.nonSubmittedReporters[0].detectionTime).toBeDefined();
    expect(result.nonSubmittedReporters[1]).toMatchObject({
      userId: 'user2',
      userName: 'User 2',
      reporterName: 'Reporter 2',
      targetDate: '2025-01-15',
    });
    expect(result.nonSubmittedReporters[1].detectionTime).toBeDefined();
  });

  it('delayedReportersは空配列', async () => {
    const mockAiClient: any = {
      sendNonSubmissionAlert: jest.fn().mockRejectedValue(
        Object.assign(
          new Error(
            '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。'
          ),
          { errorCode: 'PromptNotificationSendFailure' }
        )
      ),
    };
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:30:00Z',
          executedBy: 'scheduler-001',
        },
      },
      mockAiClient
    );

    expect(result.delayedReporters).toEqual([]);
  });

  it('promptNotificationsSentは未提出者2名分の催促メール送信試行記録を含む', async () => {
    const mockAiClient: any = {
      sendNonSubmissionAlert: jest.fn().mockRejectedValue(
        Object.assign(
          new Error(
            '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。'
          ),
          { errorCode: 'PromptNotificationSendFailure' }
        )
      ),
    };
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:30:00Z',
          executedBy: 'scheduler-001',
        },
      },
      mockAiClient
    );

    expect(result.promptNotificationsSent).toBeDefined();
    expect(Array.isArray(result.promptNotificationsSent)).toBe(true);
    const failedNotifications = result.promptNotificationsSent.filter(
      (n: any) => n.status === 'failed'
    );
    expect(failedNotifications.length).toBeGreaterThanOrEqual(2);
  });

  it('detectionLogIdは log-20250115-001', async () => {
    const mockAiClient: any = {
      sendNonSubmissionAlert: jest.fn().mockRejectedValue(
        Object.assign(
          new Error(
            '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。'
          ),
          { errorCode: 'PromptNotificationSendFailure' }
        )
      ),
    };
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:30:00Z',
          executedBy: 'scheduler-001',
        },
      },
      mockAiClient
    );

    expect(result.detectionLogId).toBe('log-20250115-001');
  });

  it('leaderNotificationSentはtrue', async () => {
    const mockAiClient: any = {
      sendNonSubmissionAlert: jest.fn().mockRejectedValue(
        Object.assign(
          new Error(
            '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。'
          ),
          { errorCode: 'PromptNotificationSendFailure' }
        )
      ),
    };
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:30:00Z',
          executedBy: 'scheduler-001',
        },
      },
      mockAiClient
    );

    expect(result.leaderNotificationSent).toBe(true);
  });

  it('errorDetailsにメール送信失敗エラーが記録される', async () => {
    const mockAiClient: any = {
      sendNonSubmissionAlert: jest.fn().mockRejectedValue(
        Object.assign(
          new Error(
            '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。'
          ),
          { errorCode: 'PromptNotificationSendFailure' }
        )
      ),
    };
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:30:00Z',
          executedBy: 'scheduler-001',
        },
      },
      mockAiClient
    );

    expect(result.errorDetails).toBeDefined();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    expect(result.errorDetails).toContainEqual({
      step: 'PromptNotificationSendFailure',
      errorCode: 'PromptNotificationSendFailure',
      errorMessage:
        '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。',
    });
  });
});
