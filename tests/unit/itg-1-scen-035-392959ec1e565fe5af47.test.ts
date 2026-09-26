import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/non-submission-prompt-decision');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-management-view');

import { runTx3Imp1Agent, type Tx3Imp1AgentInput, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-035: リーダー通知に失敗した場合でも未提出者への催促メールが送信される', () => {
  it('リーダー通知失敗時も催促メール送信が続行される', async () => {
    const targetDate = '2024-01-15';
    const executionTimestamp = 1705276800000;
    const leaderUserIds = ['leader001', 'leader002'];

    const mockNonSubmittedReporters = [
      { userId: 'user-001', userName: 'User A', emailAddress: 'usera@example.com', promptPriority: 'high' },
      { userId: 'user-002', userName: 'User B', emailAddress: 'userb@example.com', promptPriority: 'high' },
      { userId: 'user-003', userName: 'User C', emailAddress: 'userc@example.com', promptPriority: 'high' },
    ];

    const mockPromptNotifications = [
      { recipientUserId: 'user-001', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'prompt-001' },
      { recipientUserId: 'user-002', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'prompt-002' },
      { recipientUserId: 'user-003', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'prompt-003' },
    ];

    const mockFailureNotifications = [
      { recipientUserId: 'leader001', notificationType: 'email', sendStatus: 'failure', errorMessage: 'リーダー通知送信に失敗' },
      { recipientUserId: 'leader002', notificationType: 'email', sendStatus: 'failure', errorMessage: 'リーダー通知送信に失敗' },
    ];

    const mockAiClient: Tx3Imp1AiClient = {
      judgeSchedulerExecutionTiming: async () => true,
      detectNonSubmittedReportersAtDeadline: async () => ({ nonSubmittedReporterIds: ['user-001', 'user-002', 'user-003'], detectionLogId: 'log-001', detectionCount: 3 }),
      generateNonSubmissionDetectionResult: async () => ({ nonSubmittedReporterIds: ['user-001', 'user-002', 'user-003'], detectionLogId: 'log-001', detectionCount: 3 }),
      judgePromptNecessityAndMethod: async () => true,
      sendLeaderNonSubmissionPromptNotification: async () => { throw new Error('リーダー通知送信に失敗'); },
      sendNonSubmissionPromptNotification: async () => mockPromptNotifications,
      retrieveDailyReportsForLeaderReview: async () => [],
      retrieveLeaderDashboardData: async () => ({
        submittedReportCount: 0,
        nonSubmittedReporterCount: 3,
        nonSubmittedReporters: mockNonSubmittedReporters,
        promptNotificationStatus: { sent: 3, failed: 0 },
      }),
    };

    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.leaderNotificationStatus.every((ns) => ns.sendStatus === 'failure')).toBe(true);
    expect(result.promptNotificationStatus).toHaveLength(3);
    expect(result.promptNotificationStatus.every((ns) => ns.sendStatus === 'success')).toBe(true);
    expect(result.detectionResult.nonSubmittedReporterIds).toHaveLength(3);
    expect(result.detectionResult.detectionLogId).toBe('log-001');
    expect(result.dashboardData).toBeDefined();
  });
});
