jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));

import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;

describe('SCEN-052: スケジューラ実行タイミング判定がfalseとなり処理が失敗する', () => {
  const targetDate = '2024-01-15';
  const executionContext = { scheduledAt: '09:00:00', executedBy: 'scheduler-sys' };

  beforeEach(() => {
    jest.resetAllMocks();
    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(false);
  });

  it('executionStatusがfailureとなり、報告者マスタ確認処理は呼び出されない', async () => {
    const result = await runTx5Imp1Agent({ targetDate, executionContext });

    expect(result.executionStatus).toBe('failure');
    expect(result.errorDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          step: 'スケジューラ実行タイミング判定',
          errorCode: 'SchedulerExecutionTimingError',
          errorMessage: '定時スケジューラの実行タイミングが不正です。営業日カレンダーと実行時刻を確認してください。',
        }),
      ])
    );
    expect(result.detectionLogId ?? null).toBeNull();
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.leaderNotificationSent).toBe(false);

    expect(mockedGetActiveReportersForSubmissionCheck).not.toHaveBeenCalled();
  });
});
