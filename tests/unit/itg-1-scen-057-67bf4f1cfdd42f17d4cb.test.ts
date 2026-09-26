import { describe, it, expect, beforeEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient, Tx5Imp1AgentInput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-057: 未提出者が存在しない場合、出力に空配列が記録されて正常完了する', () => {
  let mockAiClient: Tx5Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {} as Tx5Imp1AiClient;
  });

  it('提出対象者が存在しない場合、催促・リーダー通知は送信されず、正常完了する', async () => {
    const input: Tx5Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '2024-01-15T17:00:00Z',
        executedBy: 'scheduler-service',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.detectionLogId).toBe('DL-20240115-000');
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.errorDetails).toBeNull();
  });
});
