import {
  runTx3Imp1Agent,
  type Tx3Imp1AgentInput,
  type Tx3Imp1AiClient,
  type NotificationStatus,
  PromptNotificationFailure,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-031: 未提出者への催促メール送信に失敗し、PromptNotificationFailureが発生する', () => {
  let mockAiClient: Tx3Imp1AiClient;

  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader001', 'leader002'];

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue(['user-001', 'user-002']),
      generateNonSubmissionDetectionResult: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [
          { userId: 'user-001', userName: 'User 1', emailAddress: 'u1@example.com', promptPriority: 'high' },
          { userId: 'user-002', userName: 'User 2', emailAddress: 'u2@example.com', promptPriority: 'high' },
        ],
        detectionLogId: 'log-001',
        targetDate: '2024-01-15',
      }),
      judgePromptNecessityAndMethod: jest.fn().mockResolvedValue({
        isPromptNecessary: true,
        promptMethod: 'email_notification',
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue([
        { recipientUserId: 'leader001', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'hist-001' },
        { recipientUserId: 'leader002', notificationType: 'email', sendStatus: 'success', emailSendingHistoryId: 'hist-002' },
      ] as NotificationStatus[]),
      sendNonSubmissionPromptNotification: jest.fn().mockRejectedValue(new PromptNotificationFailure('未提出者への催促メール送信に失敗しました。')),
      retrieveDailyReportsForLeaderReview: jest.fn(),
      retrieveLeaderDashboardData: jest.fn(),
    };
  });

  test('should throw PromptNotificationFailure when prompt notification fails', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(PromptNotificationFailure);

    expect(mockAiClient.sendNonSubmissionPromptNotification).toHaveBeenCalled();
  });

  test('should have correct error message', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    try {
      await runTx3Imp1Agent(input, mockAiClient);
      throw new Error('Expected PromptNotificationFailure to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PromptNotificationFailure);
      expect((error as Error).message).toBe('未提出者への催促メール送信に失敗しました。');
    }
  });
});
