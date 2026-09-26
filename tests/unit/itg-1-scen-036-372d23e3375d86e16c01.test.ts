import { describe, it, expect, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/non-submission-prompt-decision');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-management-view');

import { runTx3Imp1Agent, type Tx3Imp1AgentInput, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-036: 催促メール送信に失敗した場合でもダッシュボードデータが生成され、未送信フラグが立てられる', () => {
  it('催促メール送信失敗時もダッシュボードデータが生成される', async () => {
    const targetDate = '2025-01-15';
    const executionTimestamp = 1705276800000;
    const leaderUserIds = ['leader-001'];

    const mockNonSubmittedReporters = [
      { userId: 'user-002', userName: 'User B', emailAddress: 'userb@example.com', promptPriority: 'high' },
      { userId: 'user-003', userName: 'User C', emailAddress: 'userc@example.com', promptPriority: 'high' },
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

    const mockFailedPromptNotifications = [
      { recipientUserId: 'user-002', notificationType: 'email', sendStatus: 'failed', errorMessage: '未提出者への催促メール送信に失敗しました。' },
      { recipientUserId: 'user-003', notificationType: 'email', sendStatus: 'failed', errorMessage: '未提出者への催促メール送信に失敗しました。' },
    ];

    const mockAiClient: Tx3Imp1AiClient = {
      judgeSchedulerExecutionTiming: async () => true,
      detectNonSubmittedReportersAtDeadline: async () => ({ nonSubmittedReporterIds: ['user-002', 'user-003'], detectionLogId: 'log-001', detectionCount: 2 }),
      generateNonSubmissionDetectionResult: async () => ({ nonSubmittedReporterIds: ['user-002', 'user-003'], detectionLogId: 'log-001', detectionCount: 2 }),
      judgePromptNecessityAndMethod: async () => true,
      sendLeaderNonSubmissionPromptNotification: async () => mockLeaderNotifications[0],
      sendNonSubmissionPromptNotification: async () => { throw new Error('未提出者への催促メール送信に失敗しました。'); },
      retrieveDailyReportsForLeaderReview: async () => [],
      retrieveLeaderDashboardData: async () => ({
        submittedReportCount: 0,
        nonSubmittedReporterCount: 2,
        nonSubmittedReporters: mockNonSubmittedReporters,
        promptNotificationStatus: { sent: 0, failed: 2 },
      }),
    };

    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.detectionResult.detectionLogId).toBe('log-001');
    expect(result.leaderNotificationStatus[0].sendStatus).toBe('success');
    expect(result.promptNotificationStatus).toHaveLength(2);
    expect(result.promptNotificationStatus.every((ns) => ns.sendStatus === 'failed')).toBe(true);
    expect(result.promptNotificationStatus[0].errorMessage).toBe('未提出者への催促メール送信に失敗しました。');
    expect(result.dashboardData).toBeDefined();
    expect(result.dashboardData.nonSubmittedReporterCount).toBe(2);
    expect(result.executionTimestamp).toBeDefined();
  });
});
