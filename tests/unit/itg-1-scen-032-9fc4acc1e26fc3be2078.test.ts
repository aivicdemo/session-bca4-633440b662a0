import {
  runTx3Imp1Agent,
  type Tx3Imp1AgentInput,
  type Tx3Imp1AiClient,
  type NotificationStatus,
  DetectionLogRecordingFailure,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-032: 未提出者検知ログの記録に失敗し、DetectionLogRecordingFailureが発生する', () => {
  let mockAiClient: Tx3Imp1AiClient;

  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader-001', 'leader-002'];

  beforeEach(() => {
    const nonSubmittedReporterIds = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'];

    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue(nonSubmittedReporterIds),
      generateNonSubmissionDetectionResult: jest.fn().mockResolvedValue({
        nonSubmittedReporters: nonSubmittedReporterIds.map(id => ({
          userId: id,
          userName: `User ${id}`,
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
      sendNonSubmissionPromptNotification: jest.fn().mockRejectedValue(new DetectionLogRecordingFailure('検知ログの記録に失敗しました。')),
      retrieveDailyReportsForLeaderReview: jest.fn(),
      retrieveLeaderDashboardData: jest.fn(),
    };
  });

  test('should throw DetectionLogRecordingFailure when log recording fails', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(DetectionLogRecordingFailure);

    expect(mockAiClient.retrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(mockAiClient.retrieveLeaderDashboardData).not.toHaveBeenCalled();
  });

  test('should have correct error message', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    try {
      await runTx3Imp1Agent(input, mockAiClient);
      throw new Error('Expected DetectionLogRecordingFailure to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DetectionLogRecordingFailure);
      expect((error as Error).message).toBe('検知ログの記録に失敗しました。');
    }
  });
});
