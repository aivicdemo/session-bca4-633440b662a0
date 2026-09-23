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

import { runTx5Imp1Agent, DetectionLogRecordingFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
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

describe('SCEN-056: 検知ログ記録に失敗してリーダーへの通知送信が途絶する', () => {
  const targetDate = '2024-01-15';
  const executionContext = { scheduledAt: '09:00:00', executedBy: 'scheduler-service' };

  const NON_SUBMITTED = [
    { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A', targetDate: '2024-01-15', detectionTime: '2024-01-15T09:00:30Z' },
    { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B', targetDate: '2024-01-15', detectionTime: '2024-01-15T09:00:30Z' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue([
      { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A' },
      { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B' },
      { userId: 'U003', userName: 'Reporter C', reporterName: 'Report C' },
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
        { userId: 'U001', notificationType: 'non_submission_alert', sentAt: '2024-01-15T09:01:00Z', status: 'sent' },
        { userId: 'U002', notificationType: 'non_submission_alert', sentAt: '2024-01-15T09:01:01Z', status: 'sent' },
      ],
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockRejectedValue(
      new DetectionLogRecordingFailure('検知ログの記録に失敗しました。永続化層を確認してください。')
    );
  });

  it('executionStatusがpartial_failureとなり、検知ログ記録失敗によりリーダー通知は送信されない', async () => {
    const result = await runTx5Imp1Agent({ targetDate, executionContext });

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'U001' }),
        expect.objectContaining({ userId: 'U002' }),
      ])
    );
    expect(result.delayedReporters).toEqual([]);
    expect(Array.isArray(result.promptNotificationsSent)).toBe(true);
    result.promptNotificationsSent.forEach((n: { status: string }) => expect(n).toHaveProperty('status'));
    expect(result.detectionLogId ?? null).toBeNull();
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.errorDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          step: '検知ログ記録',
          errorCode: 'DETECTION_LOG_RECORDING_FAILED',
          errorMessage: '検知ログの記録に失敗しました。永続化層を確認してください。',
        }),
      ])
    );
  });
});
