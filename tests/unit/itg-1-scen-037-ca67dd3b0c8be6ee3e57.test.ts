import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/non-submission-prompt-decision');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-management-view');

import { runTx3Imp1Agent, type Tx3Imp1AgentInput, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-037: executionStatusが partial_failure になる場合の部分的な失敗が記録される', () => {
  it('部分的な失敗状態が記録される', async () => {
    const targetDate = '2025-01-15';
    const executionTimestamp = 1705276800000;
    const leaderUserIds = ['leader-001'];

    const mockNonSubmittedReportersPartial = [
      { userId: 'user-001', userName: 'User A', emailAddress: 'usera@example.com', promptPriority: 'high' },
      { userId: 'user-002', userName: 'User B', emailAddress: 'userb@example.com', promptPriority: 'high' },
    ];

    const mockLeaderNotifications = [
      {
        recipientUserId: 'leader-001',
        notificationType: 'email',
        sendStatus: 'success',
        emailSendingHistoryId: 'history-001',
        errorMessage: null,
      },
    ];

    const mockPromptNotifications = [
      { recipientUserId: 'user-001', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'prompt-001' },
      { recipientUserId: 'user-002', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'prompt-002' },
    ];

    const mockAiClient: Tx3Imp1AiClient = {
      judgeSchedulerExecutionTiming: async () => true,
      detectNonSubmittedReportersAtDeadline: async () => ({ nonSubmittedReporterIds: ['user-001', 'user-002'], detectionLogId: 'log-001', detectionCount: 2 }),
      generateNonSubmissionDetectionResult: async () => ({ nonSubmittedReporterIds: ['user-001', 'user-002'], detectionLogId: 'log-001', detectionCount: 2 }),
      judgePromptNecessityAndMethod: async () => true,
      sendLeaderNonSubmissionPromptNotification: async () => mockLeaderNotifications[0],
      sendNonSubmissionPromptNotification: async () => mockPromptNotifications,
      retrieveDailyReportsForLeaderReview: async () => [],
      retrieveLeaderDashboardData: async () => ({
        submittedReportCount: 0,
        nonSubmittedReporterCount: 2,
        nonSubmittedReporters: mockNonSubmittedReportersPartial,
        promptNotificationStatus: { sent: 2, failed: 0 },
      }),
    };

    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.detectionResult.nonSubmittedReporterIds).toHaveLength(2);
    expect(result.detectionResult.detectionLogId).toBe('log-001');
    expect(result.leaderNotificationStatus[0].sendStatus).toBe('success');
    expect(result.promptNotificationStatus).toHaveLength(2);
    expect(result.promptNotificationStatus.every((ns) => ns.sendStatus === 'success')).toBe(true);
    expect(result.dashboardData).toBeDefined();
    expect(result.executionTimestamp).toBeGreaterThan(executionTimestamp);
  });
});
