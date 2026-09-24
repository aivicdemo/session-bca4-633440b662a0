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

describe('SCEN-059: 催促メール送信に失敗した対象者について出力に失敗状態が記録される', () => {
  const targetDate = '2024-01-15';
  const executionContext = { scheduledAt: '2024-01-15T17:00:00Z', executedBy: 'scheduler-001' };

  const NON_SUBMITTED = [
    { userId: 'user-001', userName: 'Reporter A', reporterName: 'Report A', targetDate: '2024-01-15', detectionTime: '2024-01-15T17:00:30Z' },
    { userId: 'user-002', userName: 'Reporter B', reporterName: 'Report B', targetDate: '2024-01-15', detectionTime: '2024-01-15T17:00:30Z' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue([
      { userId: 'user-001', userName: 'Reporter A', reporterName: 'Report A' },
      { userId: 'user-002', userName: 'Reporter B', reporterName: 'Report B' },
      { userId: 'user-003', userName: 'Reporter C', reporterName: 'Report C' },
      { userId: 'user-004', userName: 'Reporter D', reporterName: 'Report D' },
    ]);
    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: NON_SUBMITTED,
      delayedReporters: [],
    });
    mockedJudgePromptNecessityAndMethod.mockResolvedValue([
      { userId: 'user-001', notificationType: 'non_submission_alert' },
      { userId: 'user-002', notificationType: 'non_submission_alert' },
    ]);
    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      promptNotificationsSent: [
        { userId: 'user-001', notificationType: 'non_submission_alert', sentAt: '2024-01-15T17:01:00Z', status: 'sent' },
        { userId: 'user-002', notificationType: 'non_submission_alert', sentAt: '2024-01-15T17:01:01Z', status: 'failed' },
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
      detectionLogId: 'detection-log-20240115-002',
      leaderNotificationSent: true,
    });
  });

  it('user-002への催促送信が失敗し、executionStatusがpartial_failureとなる', async () => {
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, {} as any);

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.promptNotificationsSent).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: 'user-002', status: 'failed' })])
    );
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          step: 'PromptNotificationSendFailure',
          errorCode: 'PromptNotificationSendFailure',
          errorMessage: '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。',
        }),
      ])
    );
    expect(typeof result.detectionLogId).toBe('string');
    expect(result.detectionLogId).not.toBeNull();
    expect(result.leaderNotificationSent).toBe(true);
  });
});
