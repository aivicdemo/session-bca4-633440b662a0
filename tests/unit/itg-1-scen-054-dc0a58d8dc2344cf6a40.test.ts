jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock('../../src/logic/non-submission-prompt-decision', () => ({
  judgePromptNecessityAndMethod: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));

import { runTx5Imp1Agent, PromptDecisionFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedJudgePromptNecessityAndMethod = judgePromptNecessityAndMethod as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.Mock;

describe('SCEN-054: 未提出・遅延の判定ロジックが失敗して催促メール送信に進めない', () => {
  const targetDate = '2025-01-15';
  const executionContext = { scheduledAt: '2025-01-15T17:00:00Z', executedBy: 'system-scheduler' };

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({ shouldExecute: true });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue([
      { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A' },
      { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B' },
      { userId: 'U003', userName: 'Reporter C', reporterName: 'Report C' },
    ]);

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A', targetDate: '2025-01-15', detectionTime: '2025-01-15T17:00:30Z' },
        { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B', targetDate: '2025-01-15', detectionTime: '2025-01-15T17:00:30Z' },
      ],
      delayedReporters: [],
    });

    mockedJudgePromptNecessityAndMethod.mockRejectedValue(
      new PromptDecisionFailure('未提出・遅延の判定に失敗しました。業務ルール設定を確認してください。')
    );
  });

  it('executionStatusがfailureとなり、催促メール送信・検知ログ記録は実行されない', async () => {
    const result = await runTx5Imp1Agent({ targetDate, executionContext });

    expect(result.executionStatus).toBe('failure');
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.errorDetails).toEqual([
      expect.objectContaining({
        step: '未提出・遅延判定',
        errorCode: 'PROMPT_DECISION_FAILED',
        errorMessage: '未提出・遅延の判定に失敗しました。業務ルール設定を確認してください。',
      }),
    ]);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.detectionLogId ?? null).toBeNull();
    expect(result.leaderNotificationSent).toBe(false);

    expect(mockedSendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
    expect(mockedRetrieveNonSubmissionDetectionLogsByDate).not.toHaveBeenCalled();
  });
});
