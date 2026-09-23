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
    { reporterId: 'R001', userId: 'reporter-001', userName: 'reporter-001', reporterName: '報告者1', emailAddress: 'reporter-001@example.com', department: 'team-A', status: 'active' },
    { reporterId: 'R002', userId: 'reporter-002', userName: 'reporter-002', reporterName: '報告者2', emailAddress: 'reporter-002@example.com', department: 'team-A', status: 'active' },
    { reporterId: 'R003', userId: 'reporter-003', userName: 'reporter-003', reporterName: '報告者3', emailAddress: 'reporter-003@example.com', department: 'team-A', status: 'active' },
  ];

  const otherTeamReporters = [
    { reporterId: 'X001', userId: 'other-001', userName: 'other-001', reporterName: 'その他1', emailAddress: 'other-001@example.com', department: 'team-B', status: 'active' },
  ];

  const submittedDailyReports = [
    { dailyReportId: 'DR-046-1', userId: 'reporter-001', reportDate: targetDate, businessContent: '本日の業務内容', submittedAt: `${targetDate}T09:00:00+09:00` },
    { dailyReportId: 'DR-046-2', userId: 'reporter-002', reportDate: targetDate, businessContent: '本日の業務内容', submittedAt: `${targetDate}T09:01:00+09:00` },
  ];

  const nonSubmittedReporters = [
    { userId: 'reporter-003', userName: 'reporter-003', reporterName: '報告者3', lastSubmissionDate: '2025-01-14' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: `${targetDate}T17:00:00+09:00`,
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    mockedGetActiveReportersForSubmissionCheck.mockImplementation(async (input: any) => {
      if (input?.teamId === 'team-A') {
        return {
          success: true,
          reporters: teamAReporters,
          totalCount: teamAReporters.length,
          message: '有効な報告者を取得しました。',
        };
      }
      return {
        success: true,
        reporters: otherTeamReporters,
        totalCount: otherTeamReporters.length,
        message: '有効な報告者を取得しました。',
      };
    });

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      dailyReports: submittedDailyReports,
      totalCount: submittedDailyReports.length,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: `${targetDate}T18:00:00+09:00`,
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters,
      detectionLog: {
        detectionLogId: 'LOG-046-001',
        targetDate,
        detectionDateTime: `${targetDate}T18:00:00+09:00`,
        totalReportersCount: teamAReporters.length,
        nonSubmittedCount: nonSubmittedReporters.length,
        submittedCount: submittedDailyReports.length,
      },
      detectionTimestamp: `${targetDate}T18:00:00+09:00`,
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      isPromptNecessary: true,
      promptPriority: 'medium',
      promptMethod: 'email',
      estimatedNonSubmissionReason: 'unknown',
      suggestedPromptMessage: '日報の提出をお願いします。',
      overdueDurationMinutes: 30,
    });

    mockedSendNonSubmissionPromptNotification.mockResolvedValue(true);

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-LEADER-046-001',
      sentAt: new Date(`${targetDate}T18:05:00+09:00`),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: nonSubmittedReporters.length,
      errorDetails: null,
    });

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      submittedReports: submittedDailyReports,
      nonSubmittedReporters,
      detectionLogs: [],
      emailSendingHistory: [],
      submissionStatusSummary: {
        submittedCount: submittedDailyReports.length,
        nonSubmittedCount: nonSubmittedReporters.length,
        submissionRate: 66.7,
        promptedCount: nonSubmittedReporters.length,
      },
      progressSummaryText: '提出率66.7%、未提出者1名、主要課題：進捗遅延',
    });
  });

  it('teamId=team-Aの報告者のみが処理対象になる', async () => {
    const result = await runTx4Imp1Agent({
      targetDate,
      leaderUserId,
      teamId,
    });

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe(targetDate);
    expect(result.submittedReportCount).toBe(2);
    expect(result.nonSubmittedReporterCount).toBe(1);
    expect(result.nonSubmittedReporters).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: 'reporter-003' })])
    );
    expect(result.promptNotificationsSent).toBe(1);
    expect(result.promptNotificationsFailed).toBe(0);
    expect(result.progressSummary).toContain('66.7%');
    expect(result.leaderNotificationSent).toBe(true);
    expect(typeof result.detectionLogId).toBe('string');
    expect(result.detectionLogId.length).toBeGreaterThan(0);
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
    expect(result.errors ?? []).toEqual([]);

    expect(mockedGetActiveReportersForSubmissionCheck).toHaveBeenCalledWith(
      expect.objectContaining({ teamId: 'team-A' })
    );

    const detectCallArgs = mockedDetectNonSubmittedReportersAtDeadline.mock.calls[0]?.[0];
    expect(JSON.stringify(detectCallArgs)).not.toContain('other-001');

    const promptCallArgs = mockedSendNonSubmissionPromptNotification.mock.calls.map((c) => c[0]);
    expect(JSON.stringify(promptCallArgs)).not.toContain('other-001');
  });
});
