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

describe('SCEN-050: 定時スケジューラ実行タイミング正常・未提出者と遅延者を正しく判定・催促メール送信完了', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('スケジューラ実行が正常で、未提出者2名と遅延者1名を判定し、催促メール送信と検知ログ記録が完了する', async () => {
    const executionContext = {
      scheduledAt: '2024-01-15T17:00:00Z',
      executedBy: 'scheduler-system',
    };
    const targetDate = '2024-01-15';

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue([
      { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A' },
      { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B' },
      { userId: 'U003', userName: 'Reporter C', reporterName: 'Report C' },
      { userId: 'U004', userName: 'Reporter D', reporterName: 'Report D' },
      { userId: 'U005', userName: 'Reporter E', reporterName: 'Report E' },
    ]);

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmitted: [
        { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A', targetDate: '2024-01-15', detectionTime: '2024-01-15T17:00:30Z' },
        { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B', targetDate: '2024-01-15', detectionTime: '2024-01-15T17:00:30Z' },
      ],
      delayed: [
        { userId: 'U003', userName: 'Reporter C', reporterName: 'Report C', submissionTime: '2024-01-15T17:15:45Z', delayMinutes: 15 },
      ],
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue([
      { userId: 'U001', notificationType: 'non_submission_alert' },
      { userId: 'U002', notificationType: 'non_submission_alert' },
      { userId: 'U003', notificationType: 'delayed_submission_alert' },
    ]);

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      promptNotificationsSent: [
        { userId: 'U001', notificationType: 'non_submission_alert', sentAt: '2024-01-15T17:01:00Z', status: 'sent' },
        { userId: 'U002', notificationType: 'non_submission_alert', sentAt: '2024-01-15T17:01:01Z', status: 'sent' },
        { userId: 'U003', notificationType: 'delayed_submission_alert', sentAt: '2024-01-15T17:01:02Z', status: 'sent' },
      ],
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      detectionLogId: 'DL-20240115-001',
      leaderNotificationSent: true,
    });

    const input = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '2024-01-15T17:00:00Z',
        executedBy: 'scheduler-system',
      },
    };

    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0]).toEqual({
      userId: 'U001',
      userName: 'Reporter A',
      reporterName: 'Report A',
      targetDate: '2024-01-15',
      detectionTime: '2024-01-15T17:00:30Z',
    });
    expect(result.nonSubmittedReporters[1]).toEqual({
      userId: 'U002',
      userName: 'Reporter B',
      reporterName: 'Report B',
      targetDate: '2024-01-15',
      detectionTime: '2024-01-15T17:00:30Z',
    });

    expect(result.delayedReporters).toHaveLength(1);
    expect(result.delayedReporters[0]).toEqual({
      userId: 'U003',
      userName: 'Reporter C',
      reporterName: 'Report C',
      submissionTime: '2024-01-15T17:15:45Z',
      delayMinutes: 15,
    });

    expect(result.promptNotificationsSent).toHaveLength(3);
    expect(result.promptNotificationsSent.map((n: any) => n.userId)).toEqual(['U001', 'U002', 'U003']);
    expect(result.promptNotificationsSent.every((n: any) => n.status === 'sent')).toBe(true);

    expect(result.detectionLogId).toBe('DL-20240115-001');

    expect(result.leaderNotificationSent).toBe(true);

    expect(result.errorDetails).toBeNull();
  });
});
