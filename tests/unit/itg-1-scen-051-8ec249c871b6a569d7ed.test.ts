import { runTx5Imp1Agent, Tx5Imp1AiClient, SchedulerExecutionTimingError } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-051: スケジューラ実行タイミングが営業日カレンダーと不整合で処理が失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail with SchedulerExecutionTimingError when execution timing is invalid', async () => {
    const mockAiClient: Tx5Imp1AiClient = {};

    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming' as any).mockRejectedValue(
      new SchedulerExecutionTimingError('定時スケジューラの実行タイミングが不正です。営業日カレンダーと実行時刻を確認してください。')
    );

    const input = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '2024-01-15T17:30:00Z',
        executedBy: 'system',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.[0]).toMatchObject({
      step: 'judgeSchedulerExecutionTiming',
      errorCode: 'SchedulerExecutionTimingError',
      errorMessage: '定時スケジューラの実行タイミングが不正です。営業日カレンダーと実行時刻を確認してください。',
    });
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.detectionLogId).toBeNull();
  });
});
