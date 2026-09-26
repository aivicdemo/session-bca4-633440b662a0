import { describe, it, expect, beforeEach } from '@jest/globals';
import { runTx5Imp1Agent, DetectionLogRecordingFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient, Tx5Imp1AgentInput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-056: 検知ログ記録に失敗してリーダーへの通知送信が途断する', () => {
  let mockAiClient: Tx5Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {} as Tx5Imp1AiClient;
  });

  it('検知ログ記録に失敗した場合、executionStatusが partial_failureになる', async () => {
    const input: Tx5Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '09:00:00',
        executedBy: 'scheduler-service',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toBeDefined();
    expect(result.detectionLogId).toBeNull();
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails![0]).toMatchObject({
      step: 'retrieveNonSubmissionDetectionLogsByDate',
      errorCode: 'DETECTION_LOG_RECORDING_FAILED',
    });
  });
});
