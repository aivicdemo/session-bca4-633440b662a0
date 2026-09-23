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

import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
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

describe('SCEN-055: 催促メール送信に失敗してもリーダー通知と検知ログ記録は実行され部分失敗で完了する', () => {
  const targetDate = '2025-01-15';
  const executionContext = { scheduledAt: '2025-01-15T17:30:00Z', executedBy: 'scheduler-001' };

  const NON_SUBMITTED = [
    { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A', targetDate: '2025-01-15', detectionTime: '2025-01-15T17:30:30Z' },
    { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B', targetDate: '2025-01-15', detectionTime: '2025-01-15T17:30:30Z' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({ shouldExecute: true });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue([
      { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A' },
      { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B' },
      { userId: 'U003', userName: 'Reporter C', reporterName: 'Report C' },
      { userId: 'U004', userName: 'Reporter D', reporterName: 'Report D' },
      { userId: 'U005', userName: 'Reporter E', reporterName: 'Report E' },
    ]);

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: NON_SUBMITTED,
      delayedReporters: [],
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue([
      { userId: 'U001', notificationType: 'non_submission_alert' },
      { userId: 'U002', notificationType: 'non_submission_alert' },
    ]);

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      promptNotificationsSent: [
        { userId: 'U001', notificationType: 'non_submission_alert', sentAt: '2025-01-15T17:31:00Z', status: 'failed' },
        { userId: 'U002', notificationType: 'non_submission_alert', sentAt: '2025-01-15T17:31:01Z', status: 'failed' },
      ],
      errorDetails: [
        {
          step: 'PromptNotificationSendFailure',
          errorCode: 'PromptNotificationSendFailure',
          errorMessage: '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。',
        },
      ],
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      detectionLogId: 'log-20250115-001',
      leaderNotificationSent: true,
    });
  });

  it('executionStatusがpartial_failureとなり、催促メール送信失敗が記録されつつリーダー通知・検知ログ記録は完了する', async () => {
    const result = await runTx5Imp1Agent({ targetDate, executionContext });

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'U001', targetDate: '2025-01-15' }),
        expect.objectContaining({ userId: 'U002', targetDate: '2025-01-15' }),
      ])
    );
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toHaveLength(2);
    expect(
      result.promptNotificationsSent.every((n: { status: string }) => n.status === 'failed')
    ).toBe(true);
    expect(result.detectionLogId).toBe('log-20250115-001');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.errorDetails).toEqual([
      expect.objectContaining({
        step: 'PromptNotificationSendFailure',
        errorCode: 'PromptNotificationSendFailure',
        errorMessage: '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。',
      }),
    ]);
  });
});
