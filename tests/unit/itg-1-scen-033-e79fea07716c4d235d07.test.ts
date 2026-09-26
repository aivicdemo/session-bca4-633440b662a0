import {
  runTx3Imp1Agent,
  type Tx3Imp1AgentInput,
  type Tx3Imp1AiClient,
  type NotificationStatus,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-033: 未提出者が0件の場合、空の一覧でリーダーに通知される', () => {
  let mockAiClient: Tx3Imp1AiClient;

  const targetDate = '2024-01-10';
  const executionTimestamp = 1704902400000;
  const leaderUserIds = ['leader-001', 'leader-002'];

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue([]),
      generateNonSubmissionDetectionResult: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [],
        detectionLogId: 'log-no-detection',
        targetDate: '2024-01-10',
      }),
      judgePromptNecessityAndMethod: jest.fn().mockResolvedValue({
        isPromptNecessary: false,
        promptMethod: undefined,
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue([
        { recipientUserId: 'leader-001', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'hist-001' },
        { recipientUserId: 'leader-002', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'hist-002' },
      ] as NotificationStatus[]),
      sendNonSubmissionPromptNotification: jest.fn().mockResolvedValue([]),
      retrieveDailyReportsForLeaderReview: jest.fn().mockResolvedValue([]),
      retrieveLeaderDashboardData: jest.fn().mockResolvedValue({
        submittedReportCount: 10,
        nonSubmittedCount: 0,
        nonSubmittedReporters: [],
        promptNotificationStatus: { sent: 0, failed: 0 },
      }),
    };
  });

  test('should succeed with zero non-submitted reporters', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');

    expect(result.detectionResult).toBeDefined();
    expect((result.detectionResult as any).nonSubmittedReporters).toHaveLength(0);

    expect(result.leaderNotificationStatus).toHaveLength(2);
    expect(result.leaderNotificationStatus[0].recipientUserId).toBe('leader-001');
    expect(result.leaderNotificationStatus[0].sendStatus).toBe('success');
    expect(result.leaderNotificationStatus[1].recipientUserId).toBe('leader-002');
    expect(result.leaderNotificationStatus[1].sendStatus).toBe('success');

    expect(result.promptNotificationStatus).toHaveLength(0);

    expect(result.dashboardData).toBeDefined();
    expect((result.dashboardData as any).nonSubmittedCount).toBe(0);

    expect(result.executionTimestamp).toBeGreaterThanOrEqual(executionTimestamp);
  });
});
