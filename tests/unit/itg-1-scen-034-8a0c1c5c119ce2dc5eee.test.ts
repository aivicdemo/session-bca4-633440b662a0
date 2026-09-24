import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-034: 複数リーダーへの個別通知', () => {
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
      detectionLogId: 'log-001',
      detectionTimestamp: 1705324800000,
    };
    mockGenerateNonSubmissionDetectionResult = jest.fn().mockReturnValue(detectionResult);
    
    mockJudgePromptNecessityAndMethod = jest.fn().mockReturnValue([
      { reporterId: 'user-001', required: true },
      { reporterId: 'user-002', required: true },
      { reporterId: 'user-003', required: true },
      { reporterId: 'user-004', required: true },
      { reporterId: 'user-005', required: true },
    ]);
    
    const leaderNotifications = [
      { leaderId: 'leader-001', status: 'success', timestamp: 1705324800100 },
      { leaderId: 'leader-002', status: 'success', timestamp: 1705324800200 },
      { leaderId: 'leader-003', status: 'success', timestamp: 1705324800300 },
    ];
    mockSendLeaderNonSubmissionPromptNotification = jest
      .fn()
      .mockReturnValue(leaderNotifications);
    
    const promptNotifications = [
      { reporterId: 'user-001', status: 'success', timestamp: 1705324800400 },
      { reporterId: 'user-002', status: 'success', timestamp: 1705324800500 },
      { reporterId: 'user-003', status: 'success', timestamp: 1705324800600 },
      { reporterId: 'user-004', status: 'success', timestamp: 1705324800700 },
      { reporterId: 'user-005', status: 'success', timestamp: 1705324800800 },
    ];
    mockSendNonSubmissionPromptNotification = jest.fn().mockReturnValue(promptNotifications);
    
    mockRetrieveDailyReportsForLeaderReview = jest.fn().mockReturnValue([]);
    
    const dashboardData = {
      nonSubmittedCount: 5,
      detectionLogId: 'log-001',
      detectionTimestamp: 1705324800000,
      leaderNotifications: [
        { leaderId: 'leader-001', status: 'success' },
        { leaderId: 'leader-002', status: 'success' },
        { leaderId: 'leader-003', status: 'success' },
      ],
    };
    mockRetrieveLeaderDashboardData = jest.fn().mockReturnValue(dashboardData);
  });

  it('複数リーダーへ異なるタイムスタンプで個別に通知', async () => {
    const input = {
      targetDate: '2025-01-15',
      executionTimestamp: 1705324800000,
      leaderUserIds: ['leader-001', 'leader-002', 'leader-003'],
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
    expect(output.detectionResult.detectedReporters).toHaveLength(5);
    expect(output.leaderNotificationStatus).toHaveLength(3);
    expect(output.leaderNotificationStatus[0].timestamp).toBe(1705324800100);
    expect(output.leaderNotificationStatus[1].timestamp).toBe(1705324800200);
    expect(output.leaderNotificationStatus[2].timestamp).toBe(1705324800300);
    expect(output.leaderNotificationStatus[0].timestamp).not.toBe(
      output.leaderNotificationStatus[1].timestamp
    );
    expect(output.leaderNotificationStatus[1].timestamp).not.toBe(
      output.leaderNotificationStatus[2].timestamp
    );
    expect(output.leaderNotificationStatus.every((n: any) => n.status === 'success')).toBe(true);
    expect(output.promptNotificationStatus).toHaveLength(5);
    expect(output.dashboardData.leaderNotifications).toHaveLength(3);
    expect(output.executionTimestamp).toBeGreaterThanOrEqual(input.executionTimestamp);
  });
});
