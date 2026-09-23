jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));

import { runTx5Imp1Agent, SubmissionStatusCheckFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;

describe('SCEN-053: 日報提出状況の確認処理が失敗して未提出・遅延判定に進めない', () => {
  const targetDate = '2024-01-15';
  const executionContext = { scheduledAt: '09:00:00', executedBy: 'scheduler-system' };

  const ACTIVE_REPORTERS = [
    { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A' },
    { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B' },
    { userId: 'U003', userName: 'Reporter C', reporterName: 'Report C' },
    { userId: 'U004', userName: 'Reporter D', reporterName: 'Report D' },
    { userId: 'U005', userName: 'Reporter E', reporterName: 'Report E' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue(ACTIVE_REPORTERS);

    mockedDetectNonSubmittedReportersAtDeadline.mockRejectedValue(
      new SubmissionStatusCheckFailure('日報提出状況の確認に失敗しました。システムログを確認してください。')
    );
  });

  it('executionStatusがfailureとなり、未提出・遅延判定と催促メール送信は実行されない', async () => {
    const result = await runTx5Imp1Agent({ targetDate, executionContext });

    expect(result.executionStatus).toBe('failure');
    expect(result.errorDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          step: 'detectNonSubmittedReportersAtDeadline',
          errorCode: 'SubmissionStatusCheckFailure',
          errorMessage: '日報提出状況の確認に失敗しました。システムログを確認してください。',
        }),
      ])
    );
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.detectionLogId ?? null).toBeNull();
  });
});
