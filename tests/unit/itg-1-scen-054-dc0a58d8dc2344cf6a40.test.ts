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

describe('SCEN-054: 未提出・遅延の判定ロジックが失敗して催促メール送信に進めない', () => {
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
        targetDate: '2025-01-15',
        detectionTime: '2025-01-15T17:00:00Z',
      },
      {
        userId: 'user2',
        userName: 'User 2',
        reporterName: 'Reporter 2',
        targetDate: '2025-01-15',
        detectionTime: '2025-01-15T17:00:00Z',
      },
    ]);

    const promptDecisionError = new Error(
      '未提出・遅延の判定に失敗しました。業務ルール設定を確認してください。'
    );
    (promptDecisionError as any).errorCode = 'PROMPT_DECISION_FAILED';
    mockedJudgePromptNecessityAndMethod.mockRejectedValue(
      promptDecisionError
    );

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue(true);
    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      logId: 'log-id',
      detections: [],
    });
  });

  it('judgePromptNecessityAndMethodが失敗した場合、executionStatusがfailureになる', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:00:00Z',
          executedBy: 'system-scheduler',
        },
      },
      mockAiClient
    );

    expect(result.executionStatus).toBe('failure');
  });

  it('sendLeaderNonSubmissionPromptNotificationは呼び出されない', async () => {
    const mockAiClient: any = {};
    await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:00:00Z',
          executedBy: 'system-scheduler',
        },
      },
      mockAiClient
    );

    expect(mockedSendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });

  it('retrieveNonSubmissionDetectionLogsByDateは呼び出されない', async () => {
    const mockAiClient: any = {};
    await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:00:00Z',
          executedBy: 'system-scheduler',
        },
      },
      mockAiClient
    );

    expect(mockedRetrieveNonSubmissionDetectionLogsByDate).not.toHaveBeenCalled();
  });

  it('promptNotificationsSentは空配列で返される', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:00:00Z',
          executedBy: 'system-scheduler',
        },
      },
      mockAiClient
    );

    expect(result.promptNotificationsSent).toEqual([]);
  });

  it('errorDetailsは未提出・遅延判定エラーを含む', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:00:00Z',
          executedBy: 'system-scheduler',
        },
      },
      mockAiClient
    );

    expect(result.errorDetails).toBeDefined();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    expect(result.errorDetails).toContainEqual({
      step: '未提出・遅延判定',
      errorCode: 'PROMPT_DECISION_FAILED',
      errorMessage:
        '未提出・遅延の判定に失敗しました。業務ルール設定を確認してください。',
    });
  });

  it('nonSubmittedReportersは返されない', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:00:00Z',
          executedBy: 'system-scheduler',
        },
      },
      mockAiClient
    );

    expect(result.nonSubmittedReporters).toEqual([]);
  });

  it('detectionLogIdはnullまたは未設定', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(
      {
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:00:00Z',
          executedBy: 'system-scheduler',
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
        targetDate: '2025-01-15',
        executionContext: {
          scheduledAt: '2025-01-15T17:00:00Z',
          executedBy: 'system-scheduler',
        },
      },
      mockAiClient
    );

    expect(result.leaderNotificationSent).toBe(false);
  });
});
