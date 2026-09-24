jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));

import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

class SchedulerExecutionTimingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchedulerExecutionTimingError';
  }
}

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;

describe('SCEN-002: スケジューラ実行タイミング判定に失敗し、エージェント全体が失敗する', () => {
  const executionTimestamp = new Date('2024-01-15T16:30:00+09:00');
  const targetDate = new Date('2024-01-15T00:00:00+09:00');
  const systemContext = {
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
    auth: { isAuthenticated: true },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockedJudgeSchedulerExecutionTiming.mockRejectedValue(
      new SchedulerExecutionTimingError('業務終了時刻の判定に失敗しました。スケジューラ実行タイミングを確認してください。')
    );
  });

  it('executionStatusがfailureとなり、SchedulerExecutionTimingErrorがerrorsに記録される', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    }, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'SchedulerExecutionTimingError',
          errorMessage: '業務終了時刻の判定に失敗しました。スケジューラ実行タイミングを確認してください。',
        }),
      ])
    );
    expect(result.executionSummary).toMatch(/エラー|失敗/);
    expect(result.reportersPrompted).toBe(0);
    expect(result.reportsSubmitted).toBe(0);
    expect(result.promptsSent).toBe(0);
    expect(result.leaderNotificationsSent).toBe(0);
    expect(result.nonSubmittedReporters).toEqual([]);
  });
});
