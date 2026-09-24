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

describe('SCEN-046: teamIdが指定された場合、そのチームの報告者のみを対象に処理が実行される', () => {
  const targetDate = '2025-01-15';
  const leaderUserId = 'leader-001';
  const teamId = 'team-A';

  const teamAReporters = [
    { userId: 'reporter-001', userName: 'reporter-001', reporterName: '報告者1' },
    { userId: 'reporter-002', userName: 'reporter-002', reporterName: '報告者2' },
    { userId: 'reporter-003', userName: 'reporter-003', reporterName: '報告者3' },
  ];

  const teamASubmittedReports = [
    { userId: 'reporter-001', submissionTimestamp: '2025-01-15T16:00:00+09:00' },
    { userId: 'reporter-002', submissionTimestamp: '2025-01-15T16:10:00+09:00' },
  ];

  const teamANonSubmitted = [
    { userId: 'reporter-003', userName: 'reporter-003', reporterName: '報告者3' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      deadline: '2025-01-15T17:00:00+09:00',
    });

    mockedGetActiveReportersForSubmissionCheck.mockImplementation((input: any) => {
      if (input.teamId === 'team-A') {
        return Promise.resolve({
          reporters: teamAReporters,
          count: 3,
        });
      }
      return Promise.resolve({
        reporters: [],
        count: 0,
      });
    });

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      reports: teamASubmittedReports,
      count: 2,
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: teamANonSubmitted,
      count: 1,
      detectionLogId: 'log-20250115-team-a',
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      isPromptRequired: true,
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      sent: 1,
    });

    mockedSendNonSubmissionPromptNotification.mockResolvedValue({
      sent: 1,
      failed: 0,
    });

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      progressSummary: '提出率66.7%、未提出者1名',
      submittedCount: 2,
      nonSubmittedCount: 1,
    });
  });

  it('should only retrieve reporters for specified team', async () => {
    const fakeAiClient = {};

    await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(mockedGetActiveReportersForSubmissionCheck).toHaveBeenCalledWith(
      expect.objectContaining({ teamId: 'team-A' })
    );
  });

  it('should return correct data for team-A only', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe('2025-01-15');
    expect(result.submittedReportCount).toBe(2);
    expect(result.nonSubmittedReporterCount).toBe(1);
    expect(result.nonSubmittedReporters[0].userId).toBe('reporter-003');
    expect(result.promptNotificationsSent).toBe(1);
    expect(result.promptNotificationsFailed).toBe(0);
    expect(result.progressSummary).toContain('66.7%');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.detectionLogId).toBe('log-20250115-team-a');
  });

  it('should pass teamId to detection functions', async () => {
    const fakeAiClient = {};

    await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(mockedDetectNonSubmittedReportersAtDeadline).toHaveBeenCalledWith(
      expect.objectContaining({ teamId: 'team-A' })
    );
  });

  it('should only send notifications for team-A non-submitted reporters', async () => {
    const fakeAiClient = {};

    await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(mockedSendNonSubmissionPromptNotification).toHaveBeenCalledTimes(1);
  });
});
