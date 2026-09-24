import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-032: DetectionLogRecordingFailure エラー発生', () => {
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
      .mockReturnValue(['user-001', 'user-002', 'user-003', 'user-004', 'user-005']);
    
    const detectionResult = {
      detectedReporters: ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'],
      detectionLogId: 'det-log-20240115-001',
      detectionTimestamp: 1705276800000,
    };
    mockGenerateNonSubmissionDetectionResult = jest.fn().mockReturnValue(detectionResult);
    
    mockJudgePromptNecessityAndMethod = jest.fn().mockReturnValue([
      { reporterId: 'user-001', required: true },
      { reporterId: 'user-002', required: true },
      { reporterId: 'user-003', required: true },
      { reporterId: 'user-004', required: true },
      { reporterId: 'user-005', required: true },
    ]);
    
    mockSendLeaderNonSubmissionPromptNotification = jest.fn().mockReturnValue([
      { leaderId: 'leader-001', status: 'success', timestamp: 1705276800100 },
      { leaderId: 'leader-002', status: 'success', timestamp: 1705276800200 },
    ]);
    
    mockSendNonSubmissionPromptNotification = jest.fn().mockImplementation(() => {
      const error = new Error('検知ログの記録に失敗しました。');
      error.name = 'DetectionLogRecordingFailure';
      throw error;
    });
    
    mockRetrieveDailyReportsForLeaderReview = jest.fn();
    mockRetrieveLeaderDashboardData = jest.fn();
  });

  it('検知ログ記録失敗で DetectionLogRecordingFailure をスロー', async () => {
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
    expect(caughtError?.name).toBe('DetectionLogRecordingFailure');
    expect(caughtError?.message).toBe('検知ログの記録に失敗しました。');
    expect(mockRetrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(mockRetrieveLeaderDashboardData).not.toHaveBeenCalled();
  });
});
