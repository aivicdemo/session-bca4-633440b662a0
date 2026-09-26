import {
  runTx3Imp1Agent,
  type Tx3Imp1AgentInput,
  type Tx3Imp1AiClient,
  type NotificationStatus,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-026: 代表的な正常入力で未提出者検知・リーダー通知・催促メール送信がすべて完了する', () => {
  let mockAiClient: Tx3Imp1AiClient;

  const targetDate = '2024-01-15';
  const executionTimestamp = 1705324800000;
  const leaderUserIds = ['leader-001', 'leader-002'];

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue(['reporter-001', 'reporter-002', 'reporter-003']),
      generateNonSubmissionDetectionResult: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [
          { userId: 'reporter-001', userName: 'Reporter 1', emailAddress: 'r1@example.com', promptPriority: 'high' },
          { userId: 'reporter-002', userName: 'Reporter 2', emailAddress: 'r2@example.com', promptPriority: 'high' },
          { userId: 'reporter-003', userName: 'Reporter 3', emailAddress: 'r3@example.com', promptPriority: 'high' },
        ],
        detectionLogId: 'det-log-20240115-001',
        targetDate: '2024-01-15',
      }),
      judgePromptNecessityAndMethod: jest.fn().mockResolvedValue({
        isPromptNecessary: true,
        promptMethod: 'email_notification',
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue([
        { recipientUserId: 'leader-001', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'hist-001' },
        { recipientUserId: 'leader-002', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'hist-002' },
      ] as NotificationStatus[]),
      sendNonSubmissionPromptNotification: jest.fn().mockResolvedValue([
        { recipientUserId: 'reporter-001', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'hist-003' },
        { recipientUserId: 'reporter-002', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'hist-004' },
        { recipientUserId: 'reporter-003', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'hist-005' },
      ] as NotificationStatus[]),
      retrieveDailyReportsForLeaderReview: jest.fn().mockResolvedValue([]),
      retrieveLeaderDashboardData: jest.fn().mockResolvedValue({
        submittedReportCount: 2,
        nonSubmittedCount: 3,
        nonSubmittedReporters: [],
        promptNotificationStatus: { sent: 3, failed: 0 },
      }),
    };
  });

  test('should complete detection, leader notification, and prompt notification successfully', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('success');

    expect(result.detectionResult).toBeDefined();
    expect((result.detectionResult as any).nonSubmittedReporters).toHaveLength(3);
    expect((result.detectionResult as any).detectionLogId).toBe('det-log-20240115-001');

    expect(result.leaderNotificationStatus).toHaveLength(2);
    expect(result.leaderNotificationStatus[0].recipientUserId).toBe('leader-001');
    expect(result.leaderNotificationStatus[0].sendStatus).toBe('success');
    expect(result.leaderNotificationStatus[1].recipientUserId).toBe('leader-002');
    expect(result.leaderNotificationStatus[1].sendStatus).toBe('success');

    expect(result.promptNotificationStatus).toHaveLength(3);
    expect(result.promptNotificationStatus.every((n) => n.sendStatus === 'success')).toBe(true);

    expect(result.dashboardData).toBeDefined();
    expect((result.dashboardData as any).nonSubmittedCount).toBe(3);

    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
    expect(result.executionTimestamp).toBeLessThanOrEqual(Date.now());

    expect(mockAiClient.judgeSchedulerExecutionTiming).toHaveBeenCalled();
    expect(mockAiClient.detectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockAiClient.generateNonSubmissionDetectionResult).toHaveBeenCalled();
    expect(mockAiClient.judgePromptNecessityAndMethod).toHaveBeenCalled();
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).toHaveBeenCalled();
    expect(mockAiClient.sendNonSubmissionPromptNotification).toHaveBeenCalled();
    expect(mockAiClient.retrieveDailyReportsForLeaderReview).toHaveBeenCalled();
    expect(mockAiClient.retrieveLeaderDashboardData).toHaveBeenCalled();
  });
});
