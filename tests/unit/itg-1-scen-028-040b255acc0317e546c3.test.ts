import {
  runTx3Imp1Agent,
  type Tx3Imp1AgentInput,
  type Tx3Imp1AiClient,
  NonSubmissionDetectionFailure,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-028: 未提出者検知処理が失敗し、NonSubmissionDetectionFailureが発生する', () => {
  let mockAiClient: Tx3Imp1AiClient;

  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader-001', 'leader-002'];

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockResolvedValue(true),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockRejectedValue(new NonSubmissionDetectionFailure('未提出者の検知に失敗しました。')),
      generateNonSubmissionDetectionResult: jest.fn(),
      judgePromptNecessityAndMethod: jest.fn(),
      sendLeaderNonSubmissionPromptNotification: jest.fn(),
      sendNonSubmissionPromptNotification: jest.fn(),
      retrieveDailyReportsForLeaderReview: jest.fn(),
      retrieveLeaderDashboardData: jest.fn(),
    };
  });

  test('should throw NonSubmissionDetectionFailure when detection fails', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(NonSubmissionDetectionFailure);

    expect(mockAiClient.generateNonSubmissionDetectionResult).not.toHaveBeenCalled();
    expect(mockAiClient.judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(mockAiClient.sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(mockAiClient.retrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(mockAiClient.retrieveLeaderDashboardData).not.toHaveBeenCalled();
  });

  test('should propagate correct error message from NonSubmissionDetectionFailure', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    try {
      await runTx3Imp1Agent(input, mockAiClient);
      throw new Error('Expected NonSubmissionDetectionFailure to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NonSubmissionDetectionFailure);
      expect((error as Error).message).toContain('未提出者の検知に失敗しました。');
    }
  });

  test('should verify judgeSchedulerExecutionTiming was called before detection failure', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    try {
      await runTx3Imp1Agent(input, mockAiClient);
    } catch (error) {
      // Expected error
    }

    expect(mockAiClient.judgeSchedulerExecutionTiming).toHaveBeenCalled();
  });
});
