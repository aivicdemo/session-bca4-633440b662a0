import {
  runTx3Imp1Agent,
  type Tx3Imp1AgentInput,
  type Tx3Imp1AiClient,
  type NotificationStatus,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-030: 古い報告者マスタのまま未提出者検知が実行される', () => {
  let mockAiClient: Tx3Imp1AiClient;

  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader-001', 'leader-002'];

  beforeEach(() => {
    const retiredEmployeeId = 'reporter-retired-001';
    const nonSubmittedReporterIds = [retiredEmployeeId, 'reporter-001', 'reporter-002', 'reporter-003', 'reporter-004'];

    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue(nonSubmittedReporterIds),
      generateNonSubmissionDetectionResult: jest.fn().mockResolvedValue({
        nonSubmittedReporters: nonSubmittedReporterIds.map(id => ({
          userId: id,
          userName: `Reporter ${id}`,
          emailAddress: `${id}@example.com`,
          promptPriority: 'high'
        })),
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
      sendNonSubmissionPromptNotification: jest.fn().mockResolvedValue(
        nonSubmittedReporterIds.map((reporterId, idx) => ({
          recipientUserId: reporterId,
          notificationType: 'email',
          sendStatus: 'success',
          emailSendingHistoryId: `hist-${300 + idx}`,
        }))
      ),
      retrieveDailyReportsForLeaderReview: jest.fn().mockResolvedValue([]),
      retrieveLeaderDashboardData: jest.fn().mockResolvedValue({
        submittedReportCount: 4,
        nonSubmittedCount: 6,
        nonSubmittedReporters: [],
        promptNotificationStatus: { sent: 6, failed: 0 },
      }),
    };
  });

  test('should return partial_failure when old reporter master is used', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.detectionResult).toBeDefined();
    expect((result.detectionResult as any).nonSubmittedReporters.map((r: any) => r.userId)).toContain('reporter-retired-001');
    expect((result.detectionResult as any).nonSubmittedReporters).toHaveLength(5);

    expect(result.leaderNotificationStatus).toHaveLength(2);
    expect(result.promptNotificationStatus).toHaveLength(5);

    expect(result.dashboardData).toBeDefined();
    expect((result.dashboardData as any).nonSubmittedCount).toBe(6);
  });
});
