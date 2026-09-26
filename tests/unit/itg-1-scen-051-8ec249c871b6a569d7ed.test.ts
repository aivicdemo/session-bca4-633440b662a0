import { describe, it, expect, beforeEach } from '@jest/globals';
import { runTx5Imp1Agent, SchedulerExecutionTimingError } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient, Tx5Imp1AgentInput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-051: スケジューラ実行タイミングが営業日カレンダーと不整合で処理が失敗する', () => {
  let mockAiClient: Tx5Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {} as Tx5Imp1AiClient;
  });

  it('スケジューラ実行タイミング判定がエラーを返し、処理が失敗し、以降の処理は呼び出されない', async () => {
    const input: Tx5Imp1AgentInput = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '2024-01-15T17:30:00Z',
        executedBy: 'system',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();

    const errorDetail = result.errorDetails![0];
    expect(errorDetail.step).toBe('judgeSchedulerExecutionTiming');
    expect(errorDetail.errorCode).toBe('SchedulerExecutionTimingError');
    expect(errorDetail.errorMessage).toContain('定時スケジューラの実行タイミングが不正です');

    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.detectionLogId).toBeNull();
    expect(result.leaderNotificationSent).toBe(false);
  });
});
