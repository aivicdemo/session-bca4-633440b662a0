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

describe('SCEN-038: 営業日に全員が日報を提出している場合、進捗サマリーが正常に生成されリーダーに通知される', () => {
  const targetDate = '2024-01-15';
  const leaderUserId = 'leader-001';
  const teamId = 'team-A';

  const activeReporters = [
    { reporterId: 'R001', userId: 'U001', userName: '報告者1', reporterName: '報告者1', emailAddress: 'u001@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R002', userId: 'U002', userName: '報告者2', reporterName: '報告者2', emailAddress: 'u002@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R003', userId: 'U003', userName: '報告者3', reporterName: '報告者3', emailAddress: 'u003@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R004', userId: 'U004', userName: '報告者4', reporterName: '報告者4', emailAddress: 'u004@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R005', userId: 'U005', userName: '報告者5', reporterName: '報告者5', emailAddress: 'u005@example.com', department: '営業部', status: 'active' },
  ];

  const submittedDailyReports = activeReporters.map((r, i) => ({
    dailyReportId: `DR-00${i + 1}`,
    userId: r.userId,
    reportDate: targetDate,
    businessContent: '本日の業務内容',
    submittedAt: `${targetDate}T09:0${i}:00+09:00`,
  }));

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
      nonSubmittedReporters: [],
      detectionLog: {
        detectionLogId: 'LOG-038-001',
        targetDate,
        detectionDateTime: `${targetDate}T18:00:00+09:00`,
        totalReportersCount: activeReporters.length,
        nonSubmittedCount: 0,
        submittedCount: activeReporters.length,
      },
      detectionTimestamp: `${targetDate}T18:00:00+09:00`,
    });

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      isPromptNecessary: false,
      promptPriority: 'low',
      promptMethod: 'email',
      estimatedNonSubmissionReason: 'unknown',
      suggestedPromptMessage: '',
      overdueDurationMinutes: 0,
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-LEADER-038-001',
      sentAt: new Date(`${targetDate}T18:05:00+09:00`),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 0,
      errorDetails: null,
    });

    mockedSendNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      totalTargets: 0,
      successCount: 0,
      failureCount: 0,
      emailSendingHistoryIds: [],
      sentAt: `${targetDate}T18:05:00+09:00`,
      failedReporterIds: null,
      errorMessage: null,
    });

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      submittedReports: submittedDailyReports,
      nonSubmittedReporters: [],
      detectionLogs: [
        {
          detectionLogId: 'LOG-038-001',
          targetDate,
          detectionDateTime: `${targetDate}T18:00:00+09:00`,
          totalReportersCount: activeReporters.length,
          nonSubmittedCount: 0,
          submittedCount: activeReporters.length,
        },
      ],
      emailSendingHistory: [],
      submissionStatusSummary: {
        submittedCount: activeReporters.length,
        nonSubmittedCount: 0,
        submissionRate: 100,
        promptedCount: 0,
      },
    });
  });

  it('提出件数と進捗サマリーが正常に生成されリーダーに通知される', async () => {
    const result = await runTx4Imp1Agent({
      targetDate,
      leaderUserId,
      teamId,
    });

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe(targetDate);
    expect(result.submittedReportCount).toBe(5);
    expect(result.nonSubmittedReporterCount).toBe(0);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toBe(0);
    expect(result.promptNotificationsFailed).toBe(0);

    expect(result.progressSummary).toContain('提出率100%');
    expect(result.progressSummary).toContain('全員提出');
    expect(result.progressSummary).toContain('未提出者なし');

    expect(result.leaderNotificationSent).toBe(true);

    expect(result.detectionLogId).not.toBeNull();
    expect(typeof result.detectionLogId).toBe('string');
    expect(result.detectionLogId.length).toBeGreaterThan(0);

    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );

    expect(result.errors ?? []).toEqual([]);

    expect(mockedSendLeaderNonSubmissionPromptNotification).toHaveBeenCalledTimes(1);
    expect(mockedSendLeaderNonSubmissionPromptNotification).toHaveBeenCalledWith(
      expect.objectContaining({ leaderId: leaderUserId })
    );
  });
});
