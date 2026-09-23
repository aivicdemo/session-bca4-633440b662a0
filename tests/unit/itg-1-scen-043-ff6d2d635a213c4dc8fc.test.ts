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
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';

const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedJudgePromptNecessityAndMethod = judgePromptNecessityAndMethod as jest.Mock;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.Mock;
const mockedRetrieveLeaderDashboardData = retrieveLeaderDashboardData as jest.Mock;

describe('SCEN-043: 催促メール送信に一部失敗した場合、executionStatusはpartial_failureになり失敗件数がpromptNotificationsFailedに記録される', () => {
  const targetDate = '2025-01-15';
  const leaderUserId = 'leader-001';
  const teamId = 'team-001';

  const activeReporters = [
    { reporterId: 'R001', userId: 'U001', userName: '報告者1', reporterName: '報告者1', emailAddress: 'u001@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R002', userId: 'U002', userName: '報告者2', reporterName: '報告者2', emailAddress: 'u002@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R003', userId: 'U003', userName: '報告者3', reporterName: '報告者3', emailAddress: 'u003@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R004', userId: 'U004', userName: '報告者4', reporterName: '報告者4', emailAddress: 'u004@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R005', userId: 'U005', userName: '報告者5', reporterName: '報告者5', emailAddress: 'u005@example.com', department: '営業部', status: 'active' },
  ];

  const submittedDailyReports = activeReporters.slice(0, 2).map((r, i) => ({
    dailyReportId: `DR-04${i + 1}`,
    userId: r.userId,
    reportDate: targetDate,
    businessContent: '本日の業務内容',
    submittedAt: `${targetDate}T09:0${i}:00+09:00`,
  }));

  const nonSubmittedReporters = [
    { userId: 'U003', userName: 'reporter-003', reporterName: '報告者3', lastSubmissionDate: '2025-01-14' },
    { userId: 'U004', userName: 'reporter-004', reporterName: '報告者4', lastSubmissionDate: '2025-01-14' },
    { userId: 'U005', userName: 'reporter-005', reporterName: '報告者5', lastSubmissionDate: null },
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

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: activeReporters,
      totalCount: activeReporters.length,
      message: '有効な報告者を取得しました。',
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
        detectionLogId: 'LOG-043-001',
        targetDate,
        detectionDateTime: `${targetDate}T18:00:00+09:00`,
        totalReportersCount: activeReporters.length,
        nonSubmittedCount: nonSubmittedReporters.length,
        submittedCount: submittedDailyReports.length,
      },
      detectionTimestamp: `${targetDate}T18:00:00+09:00`,
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      isPromptNecessary: true,
      promptPriority: 'high',
      promptMethod: 'email',
      estimatedNonSubmissionReason: 'unknown',
      suggestedPromptMessage: '日報の提出をお願いします。',
      overdueDurationMinutes: 60,
    });

    mockedSendNonSubmissionPromptNotification
      .mockImplementationOnce(async () => true)
      .mockImplementationOnce(async () => {
        throw new Error('メール送信に失敗しました');
      })
      .mockImplementationOnce(async () => true);

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      submittedReports: submittedDailyReports,
      nonSubmittedReporters,
      detectionLogs: [
        {
          detectionLogId: 'LOG-043-001',
          targetDate,
          detectionDateTime: `${targetDate}T18:00:00+09:00`,
          totalReportersCount: activeReporters.length,
          nonSubmittedCount: nonSubmittedReporters.length,
          submittedCount: submittedDailyReports.length,
        },
      ],
      emailSendingHistory: [],
      submissionStatusSummary: {
        submittedCount: submittedDailyReports.length,
        nonSubmittedCount: nonSubmittedReporters.length,
        submissionRate: 40,
        promptedCount: nonSubmittedReporters.length,
      },
    });
  });

  it('2回目の催促メール送信失敗が記録され、executionStatusがpartial_failureになる', async () => {
    const result = await runTx4Imp1Agent({
      targetDate,
      leaderUserId,
      teamId,
    });

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.promptNotificationsFailed).toBe(1);
    expect(result.promptNotificationsSent).toBe(2);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'PromptNotificationSendingFailed',
          message: '未提出者への催促メール送信に失敗しました。',
        }),
      ])
    );

    expect(result.leaderNotificationSent).toBe(true);

    expect(typeof result.detectionLogId).toBe('string');
    expect(result.detectionLogId.length).toBeGreaterThan(0);

    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );

    expect(mockedSendNonSubmissionPromptNotification).toHaveBeenCalledTimes(3);
  });
});
