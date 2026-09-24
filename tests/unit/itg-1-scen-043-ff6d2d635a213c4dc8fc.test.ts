jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
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
jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-management-view', () => ({
  retrieveLeaderDashboardData: jest.fn(),
}));

import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';

const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedJudgePromptNecessityAndMethod = judgePromptNecessityAndMethod as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.Mock;
const mockedRetrieveLeaderDashboardData = retrieveLeaderDashboardData as jest.Mock;

describe('SCEN-043: 催促メール送信に一部失敗した場合、executionStatusはpartial_failureになり失敗件数がpromptNotificationsFailedに記録される', () => {
  const targetDate = '2025-01-15';
  const leaderUserId = 'leader-001';
  const teamId = 'team-001';

  const activeReporters = [
    { userId: 'user-001', userName: 'reporter-001', reporterName: '報告者1' },
    { userId: 'user-002', userName: 'reporter-002', reporterName: '報告者2' },
    { userId: 'user-003', userName: 'reporter-003', reporterName: '報告者3' },
    { userId: 'user-004', userName: 'reporter-004', reporterName: '報告者4' },
    { userId: 'user-005', userName: 'reporter-005', reporterName: '報告者5' },
  ];

  const submittedReports = [
    { userId: 'user-001', submissionTimestamp: '2025-01-15T16:00:00+09:00' },
    { userId: 'user-002', submissionTimestamp: '2025-01-15T16:10:00+09:00' },
  ];

  const nonSubmittedReporters = [
    { userId: 'user-003', userName: 'reporter-003', reporterName: '報告者3' },
    { userId: 'user-004', userName: 'reporter-004', reporterName: '報告者4' },
    { userId: 'user-005', userName: 'reporter-005', reporterName: '報告者5' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      deadline: '2025-01-15T17:00:00+09:00',
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      reporters: activeReporters,
      count: 5,
    });

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      reports: submittedReports,
      count: 2,
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters,
      count: 3,
      detectionLogId: 'log-20250115-001',
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      isPromptRequired: true,
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      sent: 1,
    });

    mockedSendNonSubmissionPromptNotification
      .mockResolvedValueOnce({ sent: 1, failed: 0 })
      .mockRejectedValueOnce(new Error('Send failed'))
      .mockResolvedValueOnce({ sent: 1, failed: 0 });

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      progressSummary: '提出率40%、未提出3名',
      submittedCount: 2,
      nonSubmittedCount: 3,
    });
  });

  it('should return partial_failure status when some notifications fail', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.promptNotificationsFailed).toBe(1);
    expect(result.promptNotificationsSent).toBe(2);
  });

  it('should include error with PromptNotificationSendingFailed code', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    
    const error = result.errors.find((e: any) => e.code === 'PromptNotificationSendingFailed');
    expect(error).toBeDefined();
    expect(error.message).toContain('未提出者への催促メール送信に失敗しました');
  });

  it('should still send leader notification despite partial failures', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.leaderNotificationSent).toBe(true);
  });

  it('should include detection log id and timestamp', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.detectionLogId).toBe('log-20250115-001');
    expect(result.executionTimestamp).toBeTruthy();
  });
});
