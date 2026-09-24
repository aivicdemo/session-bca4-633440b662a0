import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-036: 催促メール送信失敗でもダッシュボード生成', () => {
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
      .mockReturnValue(['user-002', 'user-003']);
    
    const detectionResult = {
      detectedReporters: ['user-002', 'user-003'],
      detectionLogId: 'log-001',
      detectionTimestamp: 1705276800000,
    };
    mockGenerateNonSubmissionDetectionResult = jest.fn().mockReturnValue(detectionResult);
    
    mockJudgePromptNecessityAndMethod = jest.fn().mockReturnValue([
      { reporterId: 'user-002', required: true },
      { reporterId: 'user-003', required: true },
    ]);
    
    mockSendLeaderNonSubmissionPromptNotification = jest.fn().mockReturnValue([
      { leaderId: 'leader-001', status: 'success', timestamp: 1705276800100 },
    ]);
    
    mockSendNonSubmissionPromptNotification = jest.fn().mockImplementation(() => {
      const error = new Error('未提出者への催促メール送信に失敗しました。');
      error.name = 'PromptNotificationFailure';
      throw error;
    });
    
    mockRetrieveDailyReportsForLeaderReview = jest.fn().mockReturnValue([]);
    
    const dashboardData = {
      nonSubmittedCount: 2,
      detectionLogId: 'log-001',
      detectionTimestamp: 1705276800000,
      unsentNotificationFlag: true,
      unsentReporters: ['user-002', 'user-003'],
    };
    mockRetrieveLeaderDashboardData = jest.fn().mockReturnValue(dashboardData);
  });

  it('催促メール送信失敗しても部分的に実行でき、ダッシュボード生成される', async () => {
    const input = {
      targetDate: '2025-01-15',
      executionTimestamp: 1705276800000,
      leaderUserIds: ['leader-001'],
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
    expect(output.detectionResult.detectionLogId).toBe('log-001');
    expect(output.leaderNotificationStatus[0].status).toBe('success');
    expect(output.promptNotificationStatus.every((n: any) => n.status === 'failed')).toBe(true);
    expect(
      output.promptNotificationStatus.every(
        (n: any) => n.message === '未提出者への催促メール送信に失敗しました。'
      )
    ).toBe(true);
    expect(output.dashboardData).toBeDefined();
    expect(output.dashboardData.unsentNotificationFlag).toBe(true);
    expect(output.executionTimestamp).toBeDefined();
  });
});
