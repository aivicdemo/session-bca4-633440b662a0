import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-035: リーダー通知失敗でも未提出者催促メール送信される', () => {
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
    mockDetectNonSubmittedReportersAtDeadline = jest.fn().mockReturnValue(['user-001', 'user-002']);
    
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
    
    mockSendLeaderNonSubmissionPromptNotification = jest.fn().mockImplementation(() => {
      const error = new Error('リーダーへの通知送信に失敗しました。');
      error.name = 'LeaderNotificationFailure';
      throw error;
    });
    
    const promptNotifications = [
      { reporterId: 'user-001', status: 'success', timestamp: 1705276800100 },
      { reporterId: 'user-002', status: 'success', timestamp: 1705276800200 },
    ];
    mockSendNonSubmissionPromptNotification = jest.fn().mockReturnValue(promptNotifications);
    
    mockRetrieveDailyReportsForLeaderReview = jest.fn().mockReturnValue([]);
    
    const dashboardData = {
      nonSubmittedCount: 2,
      detectionLogId: 'log-001',
      detectionTimestamp: 1705276800000,
    };
    mockRetrieveLeaderDashboardData = jest.fn().mockReturnValue(dashboardData);
  });

  it('リーダー通知失敗でも未提出者催促メールが全件送信される', async () => {
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

    const output = await runTx3Imp1Agent(input, aiClient);

    expect(output.executionStatus).toBe('partial_failure');
    expect(output.leaderNotificationStatus.every((n: any) => n.status === 'failure')).toBe(true);
    expect(output.promptNotificationStatus).toHaveLength(2);
    expect(output.promptNotificationStatus.every((n: any) => n.status === 'success')).toBe(true);
    expect(output.detectionResult.detectedReporters).toHaveLength(2);
    expect(output.dashboardData).toBeDefined();
  });
});
