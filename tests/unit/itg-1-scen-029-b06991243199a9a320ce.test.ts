import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-029: LeaderNotificationFailure エラー発生', () => {
  let mockJudgeSchedulerExecutionTiming: jest.Mock;
  let mockDetectNonSubmittedReportersAtDeadline: jest.Mock;
  let mockGenerateNonSubmissionDetectionResult: jest.Mock;
  let mockJudgePromptNecessityAndMethod: jest.Mock;
  let mockSendLeaderNonSubmissionPromptNotification: jest.Mock;
  let mockSendNonSubmissionPromptNotification: jest.Mock;
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;
  let mockRetrieveLeaderDashboardData: jest.Mock;

  beforeEach(() => {
    mockJudgeSchedulerExecutionTiming = jest.fn().mockReturnValue(true);
    mockDetectNonSubmittedReportersAtDeadline = jest.fn().mockImplementation(() => {
      const error = new Error('リーダーへの通知送信に失敗しました。');
      error.name = 'LeaderNotificationFailure';
      throw error;
    });
    mockGenerateNonSubmissionDetectionResult = jest.fn();
    mockJudgePromptNecessityAndMethod = jest.fn();
    mockSendLeaderNonSubmissionPromptNotification = jest.fn();
    mockSendNonSubmissionPromptNotification = jest.fn();
    mockRetrieveDailyReportsForLeaderReview = jest.fn();
    mockRetrieveLeaderDashboardData = jest.fn();
  });

  it('リーダーへの通知送信失敗で LeaderNotificationFailure をスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      executionTimestamp: 1705276800000,
      leaderUserIds: ['leader-001', 'leader-002'],
    };

    const aiClient = {
      judgeSchedulerExecutionTiming: mockJudgeSchedulerExecutionTiming,
      detectNonSubmittedReportersAtDeadline: mockDetectNonSubmittedReportersAtDeadline,
      generateNonSubmissionDetectionResult: mockGenerateNonSubmissionDetectionResult,
      judgePromptNecessityAndMethod: mockJudgePromptNecessityAndMethod,
      sendLeaderNonSubmissionPromptNotification: mockSendLeaderNonSubmissionPromptNotification,
      sendNonSubmissionPromptNotification: mockSendNonSubmissionPromptNotification,
      retrieveDailyReportsForLeaderReview: mockRetrieveDailyReportsForLeaderReview,
      retrieveLeaderDashboardData: mockRetrieveLeaderDashboardData,
    };

    let caughtError: Error | null = null;
    try {
      await runTx3Imp1Agent(input, aiClient);
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.name).toBe('LeaderNotificationFailure');
    expect(caughtError?.message).toBe('リーダーへの通知送信に失敗しました。');
    expect(mockJudgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(mockDetectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockGenerateNonSubmissionDetectionResult).not.toHaveBeenCalled();
    expect(mockJudgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(mockSendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(mockSendNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
