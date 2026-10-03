import { describe, it, expect, jest } from '@jest/globals';
import {
  runTx2Imp1Agent,
  type Tx2Imp1AiClient,
  type Tx2Imp1AgentInput,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-018: 対象日付にアクティブな報告者が存在しない場合、処理がスキップされる', () => {
  it('アクティブな報告者がいない場合、早期リターンされる', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      judgeSchedulerExecutionTiming: (jest.fn() as any).mockResolvedValue({
        shouldExecute: false,
        isExecutionTime: false,
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn() as any,
      judgePromptNecessityAndMethod: jest.fn() as any,
      sendLeaderNonSubmissionPromptNotification: jest.fn() as any,
      sendLeaderSubmissionNotification: jest.fn() as any,
      retrieveLeaderDashboardData: jest.fn() as any,
    };

    const input: Tx2Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionTimestamp: 1705276800000,
      leaderUserIds: ['leader-001'],
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);
    expect(result.executionStatus).toBe('success');
    expect(result.detectionResult.detectionCount).toBe(0);

    expect(mockAiClient.detectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(mockAiClient.judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
