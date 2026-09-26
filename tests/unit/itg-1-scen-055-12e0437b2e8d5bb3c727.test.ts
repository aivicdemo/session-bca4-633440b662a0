import { describe, it, expect, beforeEach } from '@jest/globals';
import { runTx5Imp1Agent, PromptNotificationSendFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient, Tx5Imp1AgentInput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-055: 催促メール送信に失敗してもリーダー通知と検知ログ記録は実行され部分失敗で完了する', () => {
  let mockAiClient: Tx5Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {} as Tx5Imp1AiClient;
  });

  it('催促メール送信に失敗した場合、executionStatusが partial_failureになり、errorDetailsにPromptNotificationSendFailureが記録される', async () => {
    const input: Tx5Imp1AgentInput = {
      targetDate: '2025-01-15',
      executionContext: {
        scheduledAt: '2025-01-15T17:30:00Z',
        executedBy: 'scheduler-001',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.delayedReporters).toEqual([]);
    expect(result.detectionLogId).toBe('log-20250115-001');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails![0]).toMatchObject({
      step: 'sendLeaderNonSubmissionPromptNotification',
      errorCode: 'PromptNotificationSendFailure',
    });
  });
});
