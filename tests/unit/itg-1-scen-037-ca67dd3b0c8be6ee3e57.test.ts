import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-037: partial_failure で部分的な失敗が記録', () => {
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
      .mockReturnValue(['user-001', 'user-002', 'user-003']);
    
    const detectionResult = {
      detectedReporters: ['user-001', 'user-002', 'user-003'],
      detectionLogId: 'log-001',
      detectionTimestamp: null,
    };
    mockGenerateNonSubmissionDetectionResult = jest.fn().mockReturnValue(detectionResult);
    
    mockJudgePromptNecessityAndMethod = jest.fn().mockReturnValue([
      { reporterId: 'user-001', required: true },
      { reporterId: 'user-002', required: true },
      { reporterId: 'user-003', required: true },
    ]);
    
    mockSendLeaderNonSubmissionPromptNotification = jest.fn().mockReturnValue([
      { leaderId: 'leader-001', status: 'success', timestamp: 1705276800100, detectionCompleted: true, notificationSent: true },
    ]);
    
    const promptNotifications = [
      { reporterId: 'user-001', status: 'success', timestamp: 1705276800200, detectionCompleted: true, notificationSent: true },
      { reporterId: 'user-002', status: 'success', timestamp: 1705276800300, detectionCompleted: true, notificationSent: true },
      { reporterId: 'user-003', status: 'success', timestamp: 1705276800400, detectionCompleted: true, notificationSent: true },
    ];
    mockSendNonSubmissionPromptNotification = jest.fn().mockReturnValue(promptNotifications);
    
    mockRetrieveDailyReportsForLeaderReview = jest.fn().mockReturnValue([]);
    
    const dashboardData = {
      nonSubmittedCount: 3,
      detectionLogId: 'log-001',
      detectionTimestamp: null,
    };
    mockRetrieveLeaderDashboardData = jest.fn().mockReturnValue(dashboardData);
  });

  it('部分的な失敗が記録され partial_failure ステータスになる', async () => {
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
    expect(output.detectionResult.detectedReporters).toHaveLength(3);
    expect(output.detectionResult.detectionLogId).toBe('log-001');
    expect(output.detectionResult.detectionTimestamp).toBeNull();
    expect(output.leaderNotificationStatus[0].status).toBe('success');
    expect(output.leaderNotificationStatus[0].detectionCompleted).toBe(true);
    expect(output.leaderNotificationStatus[0].notificationSent).toBe(true);
    expect(output.promptNotificationStatus).toHaveLength(3);
    expect(output.promptNotificationStatus.every((n: any) => n.status === 'success')).toBe(true);
    expect(output.promptNotificationStatus.every((n: any) => n.detectionCompleted === true)).toBe(
      true
    );
    expect(output.promptNotificationStatus.every((n: any) => n.notificationSent === true)).toBe(
      true
    );
    expect(output.dashboardData.detectionTimestamp).toBeNull();
    expect(output.executionTimestamp).toBeGreaterThan(input.executionTimestamp);
  });
});
