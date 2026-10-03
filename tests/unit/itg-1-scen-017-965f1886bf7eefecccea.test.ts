import { describe, it, expect, jest } from '@jest/globals';
import {
  runTx2Imp1Agent,
  type Tx2Imp1AiClient,
  type Tx2Imp1AgentInput,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-017: 提出期限に達していない対象日付でエラーが返される', () => {
  it('judgeSchedulerExecutionTimingが条件不満足を返した場合、以降の処理は呼び出されない', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      judgeSchedulerExecutionTiming: (jest.fn().mockResolvedValue({
        shouldExecute: false,
        isExecutionTime: false,
      }) as any),
      detectNonSubmittedReportersAtDeadline: (jest.fn() as any),
      judgePromptNecessityAndMethod: (jest.fn() as any),
      sendLeaderNonSubmissionPromptNotification: (jest.fn() as any),
      sendLeaderSubmissionNotification: (jest.fn() as any),
      retrieveLeaderDashboardData: (jest.fn() as any),
    };

    const input: Tx2Imp1AgentInput = {
      targetDate: '2025-01-15',
      executionTimestamp: 1705276800000,
      leaderUserIds: ['leader-001'],
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);
    expect(result.executionStatus).toBe('success');
    expect(result.executionSummary).toContain('スキップ');

    expect(mockAiClient.detectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(mockAiClient.judgePromptNecessityAndMethod).not.toHaveBeenCalled();
    expect(mockAiClient.sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });
});
