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

describe('SCEN-047: 一部の報告者が日報を未提出の場合、nonSubmittedReportersに詳細情報が含まれ催促メールが送信される', () => {
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
    { userId: 'user-001', submissionTimestamp: '2024-01-15T16:00:00+09:00' },
    { userId: 'user-002', submissionTimestamp: '2024-01-15T16:10:00+09:00' },
    { userId: 'user-003', submissionTimestamp: '2024-01-15T16:20:00+09:00' },
  ];

  const nonSubmittedReporters = [
    { userId: 'user-004', userName: 'reporter-004', reporterName: '田中太郎', lastSubmissionDate: '2024-01-14' },
    { userId: 'user-005', userName: 'reporter-005', reporterName: '鈴木花子', lastSubmissionDate: null },
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
      count: 3,
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters,
      count: 2,
      detectionLogId: 'log-20240115-001',
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      isPromptRequired: true,
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      sent: 1,
    });

    mockedSendNonSubmissionPromptNotification.mockResolvedValue({
      sent: 2,
      failed: 0,
    });

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      progressSummary: '提出率：60%（3/5）、未提出者：2名（田中太郎、鈴木花子）',
      submittedCount: 3,
      nonSubmittedCount: 2,
    });
  });

  it('should return success status with partial submission', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.submittedReportCount).toBe(3);
    expect(result.nonSubmittedReporterCount).toBe(2);
  });

  it('should include detailed non-submitted reporter information', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.nonSubmittedReporters).toBeDefined();
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(result.nonSubmittedReporters.length).toBe(2);

    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: 'user-004',
      userName: 'reporter-004',
      reporterName: '田中太郎',
      lastSubmissionDate: '2024-01-14',
    });

    expect(result.nonSubmittedReporters[1]).toMatchObject({
      userId: 'user-005',
      userName: 'reporter-005',
      reporterName: '鈴木花子',
      lastSubmissionDate: null,
    });
  });

  it('should send prompt notifications for all non-submitted reporters', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.promptNotificationsSent).toBe(2);
    expect(result.promptNotificationsFailed).toBe(0);
    expect(mockedSendNonSubmissionPromptNotification).toHaveBeenCalledTimes(2);
  });

  it('should include progress summary with submitted percentage and non-submitted names', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.progressSummary).toContain('提出率');
    expect(result.progressSummary).toContain('60%');
    expect(result.progressSummary).toContain('田中太郎');
    expect(result.progressSummary).toContain('鈴木花子');
  });

  it('should send leader notification with all data', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.leaderNotificationSent).toBe(true);
    expect(result.detectionLogId).toBeTruthy();
    expect(result.executionTimestamp).toBeTruthy();
  });

  it('should have no errors on success', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.errors === undefined || result.errors.length === 0).toBe(true);
  });
});
