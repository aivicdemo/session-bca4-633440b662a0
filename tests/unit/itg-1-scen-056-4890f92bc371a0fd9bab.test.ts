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

describe('SCEN-056: 検知ログ記録に失敗してリーダーへの通知送信が途断する', () => {
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
    ]);

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue([
      {
        userId: 'user1',
        userName: 'User 1',
        reporterName: 'Reporter 1',
        targetDate: '2024-01-15',
        detectionTime: '09:00:00',
      },
      {
        userId: 'user2',
        userName: 'User 2',
        reporterName: 'Reporter 2',
        targetDate: '2024-01-15',
        detectionTime: '09:00:00',
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
      userId: 'user1',
      notificationType: 'email',
      sentAt: '2024-01-15T09:00:00Z',
      status: 'sent',
    });

    const detectionLogRecordingError = new Error(
      '検知ログの記録に失敗しました。永続化層を確認してください。'
    );
    (detectionLogRecordingError as any).errorCode = 'DETECTION_LOG_RECORDING_FAILED';
    mockedRetrieveNonSubmissionDetectionLogsByDate.mockRejectedValue(
      detectionLogRecordingError
    );
  });

  it('executionStatusは partial_failure である', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2024-01-15',
        executionContext: {
          scheduledAt: '09:00:00',
          executedBy: 'scheduler-service',
        },
      },
      mockAiClient
    );

    expect(result.executionStatus).toBe('partial_failure');
  });

  it('nonSubmittedReportersは2名の未提出者データを含む', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2024-01-15',
        executionContext: {
          scheduledAt: '09:00:00',
          executedBy: 'scheduler-service',
        },
      },
      mockAiClient
    );

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: 'user1',
      userName: 'User 1',
      reporterName: 'Reporter 1',
      targetDate: '2024-01-15',
    });
    expect(result.nonSubmittedReporters[0].detectionTime).toBeDefined();
    expect(result.nonSubmittedReporters[1]).toMatchObject({
      userId: 'user2',
      userName: 'User 2',
      reporterName: 'Reporter 2',
      targetDate: '2024-01-15',
    });
    expect(result.nonSubmittedReporters[1].detectionTime).toBeDefined();
  });

  it('delayedReportersは空配列', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2024-01-15',
        executionContext: {
          scheduledAt: '09:00:00',
          executedBy: 'scheduler-service',
        },
      },
      mockAiClient
    );

    expect(result.delayedReporters).toEqual([]);
  });

  it('promptNotificationsSentは催促メール送信結果の配列を含む', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2024-01-15',
        executionContext: {
          scheduledAt: '09:00:00',
          executedBy: 'scheduler-service',
        },
      },
      mockAiClient
    );

    expect(result.promptNotificationsSent).toBeDefined();
    expect(Array.isArray(result.promptNotificationsSent)).toBe(true);
  });

  it('detectionLogIdはnullまたはundefined', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2024-01-15',
        executionContext: {
          scheduledAt: '09:00:00',
          executedBy: 'scheduler-service',
        },
      },
      mockAiClient
    );

    expect(result.detectionLogId == null).toBe(true);
  });

  it('leaderNotificationSentはfalse', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2024-01-15',
        executionContext: {
          scheduledAt: '09:00:00',
          executedBy: 'scheduler-service',
        },
      },
      mockAiClient
    );

    expect(result.leaderNotificationSent).toBe(false);
  });

  it('errorDetailsは検知ログ記録エラーを含む', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2024-01-15',
        executionContext: {
          scheduledAt: '09:00:00',
          executedBy: 'scheduler-service',
        },
      },
      mockAiClient
    );

    expect(result.errorDetails).toBeDefined();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    expect(result.errorDetails).toContainEqual({
      step: '検知ログ記録',
      errorCode: 'DETECTION_LOG_RECORDING_FAILED',
      errorMessage: '検知ログの記録に失敗しました。永続化層を確認してください。',
    });
  });
});
