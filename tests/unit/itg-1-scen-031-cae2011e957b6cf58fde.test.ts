import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-031: PromptNotificationFailure エラー発生', () => {
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
    mockDetectNonSubmittedReportersAtDeadline = jest
      .fn()
      .mockReturnValue(['user-001', 'user-002']);
    
    const detectionResult = {
      detectedReporters: ['user-001', 'user-002'],
      detectionLogId: 'log-001',
      detectionTimestamp: 1705276800000,
    };
    mockGenerateNonSubmissionDetectionResult = jest.fn().mockReturnValue(detectionResult);
    
    mockJudgePromptNecessityAndMethod = jest.fn().mockReturnValue([
      { reporterId: 'user-001', required: true },
      { reporterId: 'user-002', required: true },
    ]);
    
    mockSendLeaderNonSubmissionPromptNotification = jest.fn().mockReturnValue([
      { leaderId: 'leader001', status: 'success', timestamp: 1705276800100 },
      { leaderId: 'leader002', status: 'success', timestamp: 1705276800200 },
    ]);
    
    mockSendNonSubmissionPromptNotification = jest.fn().mockImplementation(() => {
      const error = new Error('未提出者への催促メール送信に失敗しました。');
      error.name = 'PromptNotificationFailure';
      throw error;
    });
    
    mockRetrieveDailyReportsForLeaderReview = jest.fn().mockReturnValue([]);
    mockRetrieveLeaderDashboardData = jest.fn().mockReturnValue({});
  });

  it('催促メール送信失敗で PromptNotificationFailure をスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      executionTimestamp: 1705276800000,
      leaderUserIds: ['leader001', 'leader002'],
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
    expect(caughtError?.name).toBe('PromptNotificationFailure');
    expect(caughtError?.message).toBe('未提出者への催促メール送信に失敗しました。');
    expect(mockSendNonSubmissionPromptNotification).toHaveBeenCalled();
  });
});
