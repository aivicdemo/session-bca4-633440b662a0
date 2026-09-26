import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/non-submission-prompt-decision');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-management-view');

import { runTx3Imp1Agent, type Tx3Imp1AgentInput, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-034: 複数のリーダーに対して通知が個別に送信され、各リーダーのステータスが記録される', () => {
  it('複数リーダーへの個別通知送信とステータス記録', async () => {
    const targetDate = '2025-01-15';
    const executionTimestamp = 1705324800000;
    const leaderUserIds = ['leader-001', 'leader-002', 'leader-003'];

    const mockNonSubmittedReporters = [
      { userId: 'user-001', userName: 'User A', emailAddress: 'usera@example.com', promptPriority: 'high' },
      { userId: 'user-002', userName: 'User B', emailAddress: 'userb@example.com', promptPriority: 'high' },
      { userId: 'user-003', userName: 'User C', emailAddress: 'userc@example.com', promptPriority: 'high' },
      { userId: 'user-004', userName: 'User D', emailAddress: 'userd@example.com', promptPriority: 'medium' },
      { userId: 'user-005', userName: 'User E', emailAddress: 'usere@example.com', promptPriority: 'medium' },
    ];

    const mockLeaderNotifications = [
      {
        recipientUserId: 'leader-001',
        notificationType: 'email',
        sendStatus: 'success',
        emailSendingHistoryId: 'history-001',
        errorMessage: null,
      },
      {
        recipientUserId: 'leader-002',
        notificationType: 'email',
        sendStatus: 'success',
        emailSendingHistoryId: 'history-002',
        errorMessage: null,
      },
      {
        recipientUserId: 'leader-003',
        notificationType: 'email',
        sendStatus: 'success',
        emailSendingHistoryId: 'history-003',
        errorMessage: null,
      },
    ];

    const mockPromptNotifications = [
      { recipientUserId: 'user-001', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'prompt-001' },
      { recipientUserId: 'user-002', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'prompt-002' },
      { recipientUserId: 'user-003', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'prompt-003' },
      { recipientUserId: 'user-004', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'prompt-004' },
      { recipientUserId: 'user-005', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'prompt-005' },
    ];

    let leaderNotificationCallCount = 0;
    const mockAiClient: Tx3Imp1AiClient = {
      judgeSchedulerExecutionTiming: async () => true,
      detectNonSubmittedReportersAtDeadline: async () => ({ nonSubmittedReporterIds: ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'], detectionLogId: 'log-001', detectionCount: 5 }),
      generateNonSubmissionDetectionResult: async () => ({ nonSubmittedReporterIds: ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'], detectionLogId: 'log-001', detectionCount: 5 }),
      judgePromptNecessityAndMethod: async () => true,
      sendLeaderNonSubmissionPromptNotification: async () => mockLeaderNotifications[leaderNotificationCallCount++],
      sendNonSubmissionPromptNotification: async () => mockPromptNotifications,
      retrieveDailyReportsForLeaderReview: async () => [],
      retrieveLeaderDashboardData: async () => ({
        submittedReportCount: 0,
        nonSubmittedReporterCount: 5,
        nonSubmittedReporters: mockNonSubmittedReporters,
        promptNotificationStatus: { sent: 5, failed: 0 },
      }),
    };

    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.detectionResult.nonSubmittedReporterIds).toHaveLength(5);
    expect(result.detectionResult.detectionLogId).toBe('log-001');

    expect(result.leaderNotificationStatus).toHaveLength(3);
    expect(result.leaderNotificationStatus[0].recipientUserId).toBe('leader-001');
    expect(result.leaderNotificationStatus[0].sendStatus).toBe('success');
    expect(result.leaderNotificationStatus[1].recipientUserId).toBe('leader-002');
    expect(result.leaderNotificationStatus[1].sendStatus).toBe('success');
    expect(result.leaderNotificationStatus[2].recipientUserId).toBe('leader-003');
    expect(result.leaderNotificationStatus[2].sendStatus).toBe('success');

    expect(result.promptNotificationStatus).toHaveLength(5);
    expect(result.promptNotificationStatus.every((ns) => ns.sendStatus === 'success')).toBe(true);

    expect(result.dashboardData.nonSubmittedReporterCount).toBe(5);
    expect(result.dashboardData.nonSubmittedReporters).toHaveLength(5);
    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
  });
});
