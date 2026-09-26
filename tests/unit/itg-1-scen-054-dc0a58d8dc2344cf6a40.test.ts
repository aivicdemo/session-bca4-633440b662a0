import { describe, it, expect, beforeEach } from '@jest/globals';
import { runTx5Imp1Agent, PromptDecisionFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient, Tx5Imp1AgentInput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-054: 未提出・遅延の判定ロジックが失敗して催促メール送信に進めない', () => {
  let mockAiClient: Tx5Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {} as Tx5Imp1AiClient;
  });

  it('judgePromptNecessityAndMethodが失敗した場合、executionStatusが failureになり、errorDetailsにPromptDecisionFailureが記録される', async () => {
    const input: Tx5Imp1AgentInput = {
      targetDate: '2025-01-15',
      executionContext: {
        scheduledAt: '2025-01-15T17:00:00Z',
        executedBy: 'system-scheduler',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails![0]).toMatchObject({
      step: 'judgePromptNecessityAndMethod',
      errorCode: 'PROMPT_DECISION_FAILED',
      errorMessage: '未提出・遅延の判定に失敗しました。業務ルール設定を確認してください。',
    });

    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.detectionLogId).toBeNull();
    expect(result.leaderNotificationSent).toBe(false);
  });
});
