import {
  runTx3Imp1Agent,
  type Tx3Imp1AgentInput,
  type Tx3Imp1AiClient,
  SchedulerExecutionTimingError,
} from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-027: 定時スケジューラの実行タイミング判定に失敗し、SchedulerExecutionTimingErrorが発生する', () => {
  let mockAiClient: Tx3Imp1AiClient;

  const targetDate = '2024-01-15';
  const executionTimestamp = 1705276800000;
  const leaderUserIds = ['leader001'];

  beforeEach(() => {
    mockAiClient = {
      judgeSchedulerExecutionTiming: jest.fn().mockRejectedValue(new SchedulerExecutionTimingError('定時スケジューラの実行タイミング判定に失敗しました。')),
      detectNonSubmittedReportersAtDeadline: jest.fn(),
      generateNonSubmissionDetectionResult: jest.fn(),
      judgePromptNecessityAndMethod: jest.fn(),
      sendLeaderNonSubmissionPromptNotification: jest.fn(),
      sendNonSubmissionPromptNotification: jest.fn(),
      retrieveDailyReportsForLeaderReview: jest.fn(),
      retrieveLeaderDashboardData: jest.fn(),
    };
  });

  test('should throw SchedulerExecutionTimingError and not call subsequent operations', async () => {
    const input: Tx3Imp1AgentInput = {
      targetDate,
      executionTimestamp,
      leaderUserIds,
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(SchedulerExecutionTimingError);

    expect(mockAiClient.detectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(mockAiClient.generateNonSubmissionDetectionResult).not.toHaveBeenCalled();
    expect(mockAiClient.judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(mockAiClient.sendNonSubmissionPromptNotification).not.toHaveBeenCalled();
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
      throw new Error('Expected SchedulerExecutionTimingError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(SchedulerExecutionTimingError);
      expect((error as Error).message).toBe('定時スケジューラの実行タイミング判定に失敗しました。');
    }
  });
});
