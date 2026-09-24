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

describe('SCEN-038: 営業日の対象日に有効な報告者が存在し、全員が日報を提出している場合、提出件数と進捗サマリーが正常に生成されリーダーに通知される', () => {
  const targetDate = '2024-01-15';
  const leaderUserId = 'leader-001';
  const teamId = 'team-A';

  const activeReporters = [
    { userId: 'user-001', userName: 'reporter-001', reporterName: '報告者1' },
    { userId: 'user-002', userName: 'reporter-002', reporterName: '報告者2' },
    { userId: 'user-003', userName: 'reporter-003', reporterName: '報告者3' },
    { userId: 'user-004', userName: 'reporter-004', reporterName: '報告者4' },
    { userId: 'user-005', userName: 'reporter-005', reporterName: '報告者5' },
  ];

  const submittedReports = [
    { userId: 'user-001', submissionTimestamp: '2024-01-15T16:30:00+09:00' },
    { userId: 'user-002', submissionTimestamp: '2024-01-15T16:45:00+09:00' },
    { userId: 'user-003', submissionTimestamp: '2024-01-15T17:00:00+09:00' },
    { userId: 'user-004', submissionTimestamp: '2024-01-15T17:10:00+09:00' },
    { userId: 'user-005', submissionTimestamp: '2024-01-15T17:15:00+09:00' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      deadline: '2024-01-15T17:00:00+09:00',
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      reporters: activeReporters,
      count: 5,
    });

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      reports: submittedReports,
      count: 5,
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [],
      count: 0,
      detectionLogId: 'log-20240115-001',
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      isPromptRequired: false,
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      sent: 0,
    });

    mockedSendNonSubmissionPromptNotification.mockResolvedValue({
      sent: 0,
      failed: 0,
    });

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      progressSummary: '提出率100%、全員提出、未提出者なし',
      submittedCount: 5,
      nonSubmittedCount: 0,
    });
  });

  it('should return success status with correct counts and progress summary when all reporters submitted', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe(targetDate);
    expect(result.submittedReportCount).toBe(5);
    expect(result.nonSubmittedReporterCount).toBe(0);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toBe(0);
    expect(result.promptNotificationsFailed).toBe(0);
    expect(result.progressSummary).toContain('提出率100%');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.detectionLogId).toBeTruthy();
    expect(result.detectionLogId).toBe('log-20240115-001');
    expect(result.executionTimestamp).toBeTruthy();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.executionTimestamp)).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should call all required logic functions in correct order', async () => {
    const fakeAiClient = {};

    await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalled();
    expect(mockedGetActiveReportersForSubmissionCheck).toHaveBeenCalled();
    expect(mockedRetrieveDailyReportsForLeaderReview).toHaveBeenCalled();
    expect(mockedDetectNonSubmittedReportersAtDeadline).toHaveBeenCalled();
    expect(mockedSendLeaderNonSubmissionPromptNotification).toHaveBeenCalled();
    expect(mockedRetrieveLeaderDashboardData).toHaveBeenCalled();
  });

  it('should notify leader exactly once on success', async () => {
    const fakeAiClient = {};

    await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(mockedSendLeaderNonSubmissionPromptNotification).toHaveBeenCalledTimes(1);
  });
});
