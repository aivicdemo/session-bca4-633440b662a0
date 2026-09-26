import { describe, it, expect, beforeEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient, Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-050: 定時スケジューラ実行タイミング正常・未提出者と遅延者を正しく判定・催促メール送信完了', () => {
  let mockAiClient: Tx5Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {} as Tx5Imp1AiClient;
  });

  it('スケジューラ実行が正常で、未提出者2名と遅延者1名を判定し、催促メール送信と検知ログ記録が完了する', async () => {
    const input: Tx5Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '2024-01-15T17:00:00Z',
        executedBy: 'scheduler-system',
      },
    };

    const result: Tx5Imp1AgentOutput = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: 'U001',
      userName: 'Reporter A',
      reporterName: 'Report A',
      targetDate: '2024-01-15',
      detectionTime: '2024-01-15T17:00:30Z',
    });
    expect(result.nonSubmittedReporters[1]).toMatchObject({
      userId: 'U002',
      userName: 'Reporter B',
      reporterName: 'Report B',
      targetDate: '2024-01-15',
      detectionTime: '2024-01-15T17:00:30Z',
    });

    expect(result.delayedReporters).toHaveLength(1);
    expect(result.delayedReporters[0]).toMatchObject({
      userId: 'U003',
      userName: 'Reporter C',
      reporterName: 'Report C',
      submissionTime: '2024-01-15T17:15:45Z',
      delayMinutes: 15,
    });

    expect(result.promptNotificationsSent).toBeDefined();
    expect(result.promptNotificationsSent).toHaveLength(3);
    expect(result.promptNotificationsSent.map((n) => n.userId)).toEqual(['U001', 'U002', 'U003']);
    expect(result.promptNotificationsSent.every((n) => n.status === 'sent')).toBe(true);

    expect(result.detectionLogId).toBe('DL-20240115-001');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.errorDetails).toBeNull();
  });
});