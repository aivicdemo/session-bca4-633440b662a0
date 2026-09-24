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

describe('SCEN-058: 遅延提出者が存在しない場合、出力に空配列が記録されて正常完了する', () => {
  const targetDate = '2024-01-15';
  const executionContext = { scheduledAt: '2024-01-15T18:00:00Z', executedBy: 'system-scheduler' };

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue(true);
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue([
      { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A' },
      { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B' },
      { userId: 'U003', userName: 'Reporter C', reporterName: 'Report C' },
      { userId: 'U004', userName: 'Reporter D', reporterName: 'Report D' },
      { userId: 'U005', userName: 'Reporter E', reporterName: 'Report E' },
    ]);
    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [],
      delayedReporters: [],
    });
    mockedJudgePromptNecessityAndMethod.mockResolvedValue([]);
    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      promptNotificationsSent: [],
    });
    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      detectionLogId: 'detection-log-20240115-001',
      leaderNotificationSent: true,
    });
  });

  it('未提出者・遅延提出者ともに存在せず、リーダーには検知結果が常に通知される', async () => {
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, {} as any);

    expect(result.executionStatus).toBe('success');
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.detectionLogId).toBe('detection-log-20240115-001');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.errorDetails ?? []).toEqual([]);
  });
});
