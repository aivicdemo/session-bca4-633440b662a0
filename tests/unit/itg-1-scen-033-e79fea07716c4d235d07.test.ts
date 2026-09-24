import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-033: 未提出者が 0 件の場合', () => {
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
    mockDetectNonSubmittedReportersAtDeadline = jest.fn().mockReturnValue([]);
    
    const detectionResult = {
      detectedReporters: [],
      detectionLogId: 'log-no-detection',
      detectionTimestamp: 1704902400000,
    };
    mockGenerateNonSubmissionDetectionResult = jest.fn().mockReturnValue(detectionResult);
    
    mockJudgePromptNecessityAndMethod = jest.fn().mockReturnValue([]);
    
    mockSendLeaderNonSubmissionPromptNotification = jest.fn().mockReturnValue([
      { leaderId: 'leader-001', status: 'success', timestamp: 1704902400100 },
      { leaderId: 'leader-002', status: 'success', timestamp: 1704902400200 },
    ]);
    
    mockSendNonSubmissionPromptNotification = jest.fn().mockReturnValue([]);
    mockRetrieveDailyReportsForLeaderReview = jest.fn().mockReturnValue([]);
    
    const dashboardData = {
      nonSubmittedCount: 0,
      detectionLogId: 'log-no-detection',
      detectionTimestamp: 1704902400000,
    };
    mockRetrieveLeaderDashboardData = jest.fn().mockReturnValue(dashboardData);
  });

  it('未提出者なしで成功し、リーダーに空の一覧で通知', async () => {
    const input = {
      targetDate: '2024-01-10',
      executionTimestamp: 1704902400000,
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

    const output = await runTx3Imp1Agent(input, aiClient);

    expect(output.executionStatus).toBe('success');
    expect(output.detectionResult.detectedReporters).toHaveLength(0);
    expect(output.leaderNotificationStatus).toHaveLength(2);
    expect(output.leaderNotificationStatus[0].status).toBe('success');
    expect(output.leaderNotificationStatus[1].status).toBe('success');
    expect(output.promptNotificationStatus).toHaveLength(0);
    expect(output.dashboardData.nonSubmittedCount).toBe(0);
    expect(output.executionTimestamp).toBeGreaterThanOrEqual(input.executionTimestamp);
  });
});
