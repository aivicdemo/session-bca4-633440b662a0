import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-030: 古い報告者マスタのまま未提出者検知が実行される', () => {
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
    
    const retiredEmployeeA = 'user-A';
    const nonSubmittedReporters = [retiredEmployeeA, 'user-B', 'user-C', 'user-D', 'user-E'];
    mockDetectNonSubmittedReportersAtDeadline = jest
      .fn()
      .mockReturnValue(nonSubmittedReporters);
    
    const detectionResult = {
      detectedReporters: nonSubmittedReporters,
      detectionLogId: 'log-001',
      detectionTimestamp: 1705276800000,
      totalReportersChecked: 6,
    };
    mockGenerateNonSubmissionDetectionResult = jest.fn().mockReturnValue(detectionResult);
    
    const promptRequirements = [
      { reporterId: retiredEmployeeA, required: true },
      { reporterId: 'user-B', required: true },
      { reporterId: 'user-C', required: true },
      { reporterId: 'user-D', required: true },
      { reporterId: 'user-E', required: true },
    ];
    mockJudgePromptNecessityAndMethod = jest.fn().mockReturnValue(promptRequirements);
    
    const leaderNotifications = [
      { leaderId: 'leader-001', status: 'success', timestamp: 1705276800100 },
      { leaderId: 'leader-002', status: 'success', timestamp: 1705276800200 },
    ];
    mockSendLeaderNonSubmissionPromptNotification = jest
      .fn()
      .mockReturnValue(leaderNotifications);
    
    const promptNotifications = nonSubmittedReporters.map((reporterId) => ({
      reporterId,
      status: 'success',
      timestamp: 1705276800300,
    }));
    mockSendNonSubmissionPromptNotification = jest.fn().mockReturnValue(promptNotifications);
    
    mockRetrieveDailyReportsForLeaderReview = jest.fn().mockReturnValue([]);
    
    const dashboardData = {
      nonSubmittedCount: 5,
      detectionLogId: 'log-001',
      detectionTimestamp: 1705276800000,
    };
    mockRetrieveLeaderDashboardData = jest.fn().mockReturnValue(dashboardData);
  });

  it('古いマスタで未提出者検知が実行され partial_failure になる', async () => {
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

    const output = await runTx3Imp1Agent(input, aiClient);

    expect(output.executionStatus).toBe('partial_failure');
    expect(output.detectionResult.detectedReporters).toHaveLength(6);
    expect(output.detectionResult.detectedReporters).toContain('user-A');
    expect(output.leaderNotificationStatus).toHaveLength(6);
    expect(output.promptNotificationStatus).toHaveLength(6);
  });
});
