import {
  runTx3Imp1Agent,
  type Tx3Imp1AgentInput,
  type Tx3Imp1AiClient,
  LeaderNotificationFailure,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-029: リーダーへの通知送信に失敗し、LeaderNotificationFailureが発生する', () => {
  let mockAiClient: Tx3Imp1AiClient;

  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader-001', 'leader-002'];

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockRejectedValue(new LeaderNotificationFailure('リーダーへの通知送信に失敗しました。')),
      generateNonSubmissionDetectionResult: jest.fn(),
      judgePromptNecessityAndMethod: jest.fn(),
      sendLeaderNonSubmissionPromptNotification: jest.fn(),
      sendNonSubmissionPromptNotification: jest.fn(),
      retrieveDailyReportsForLeaderReview: jest.fn(),
      retrieveLeaderDashboardData: jest.fn(),
    };
  });

  test('should throw LeaderNotificationFailure', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(LeaderNotificationFailure);

    expect(mockAiClient.generateNonSubmissionDetectionResult).not.toHaveBeenCalled();
    expect(mockAiClient.judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(mockAiClient.sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });

  test('should have correct error message', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    try {
      await runTx3Imp1Agent(input, mockAiClient);
      throw new Error('Expected LeaderNotificationFailure to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderNotificationFailure);
      expect((error as Error).message).toBe('リーダーへの通知送信に失敗しました。');
    }
  });
});
