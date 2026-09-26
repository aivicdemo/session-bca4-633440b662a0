import { describe, it, expect, beforeEach } from '@jest/globals';
import { runTx5Imp1Agent, SubmissionStatusCheckFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient, Tx5Imp1AgentInput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-053: 日報提出状況の確認処理が失敗して未提出・遅延判定に進めない', () => {
  let mockAiClient: Tx5Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {} as Tx5Imp1AiClient;
  });

  it('detectNonSubmittedReportersAtDeadlineが例外を発生させた場合、executionStatusが failureになり、errorDetailsにSubmissionStatusCheckFailureが記録される', async () => {
    const input: Tx5Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionContext: { scheduledAt: '09:00:00', executedBy: 'scheduler-system' },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.errorDetails).toBeDefined();
    const detectionError = result.errorDetails!.find((e) => e.step === 'detectNonSubmittedReportersAtDeadline');
    expect(detectionError).toBeDefined();
    expect(detectionError!.errorCode).toBe('SubmissionStatusCheckFailure');
    expect(detectionError!.errorMessage).toBe('日報提出状況の確認に失敗しました。システムログを確認してください。');

    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.detectionLogId).toBeNull();
  });
});
