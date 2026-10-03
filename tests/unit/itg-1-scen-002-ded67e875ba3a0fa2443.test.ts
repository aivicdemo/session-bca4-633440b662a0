import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
}));

import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-002: スケジューラ実行タイミング判定に失敗し、エージェント全体が失敗', () => {
  const executionTimestamp = new Date('2024-01-15T16:30:00+09:00');
  const targetDate = new Date('2024-01-15T00:00:00+09:00');
  const systemContext = {
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('SchedulerExecutionTimingErrorが発生し、executionStatusがfailureで返される', async () => {
    const testError = new Error('業務終了時刻の判定に失敗しました。スケジューラ実行タイミングを確認してください。');
    (testError as any).name = 'SchedulerExecutionTimingError';
    
    jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockRejectedValue(testError);

    const mockAiClient: any = {};
    
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    }, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0].errorCode).toBe('SchedulerExecutionTimingError');
    expect(result.errors![0].errorMessage).toContain('業務終了時刻の判定に失敗しました');
    expect(result.reportersPrompted).toBe(0);
    expect(result.reportsSubmitted).toBe(0);
    expect(result.promptsSent).toBe(0);
    expect(result.leaderNotificationsSent).toBe(0);
    expect(result.nonSubmittedReporters).toEqual([]);
  });
});
