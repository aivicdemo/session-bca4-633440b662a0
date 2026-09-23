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
    { reporterId: 'R001', userId: 'user-001', userName: 'reporter-001', reporterName: '報告者1', emailAddress: 'user-001@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R002', userId: 'user-002', userName: 'reporter-002', reporterName: '報告者2', emailAddress: 'user-002@example.com', department: '開発部', status: 'active' },
    { reporterId: 'R003', userId: 'user-003', userName: 'reporter-003', reporterName: '報告者3', emailAddress: 'user-003@example.com', department: '人事部', status: 'active' },
    { reporterId: 'R004', userId: 'user-004', userName: 'reporter-004', reporterName: '田中太郎', emailAddress: 'user-004@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R005', userId: 'user-005', userName: 'reporter-005', reporterName: '鈴木花子', emailAddress: 'user-005@example.com', department: '開発部', status: 'active' },
  ];

  const submittedDailyReports = [
    { dailyReportId: 'DR-047-1', userId: 'user-001', reportDate: targetDate, businessContent: '本日の業務内容', submittedAt: `${targetDate}T09:00:00+09:00` },
    { dailyReportId: 'DR-047-2', userId: 'user-002', reportDate: targetDate, businessContent: '本日の業務内容', submittedAt: `${targetDate}T09:01:00+09:00` },
    { dailyReportId: 'DR-047-3', userId: 'user-003', reportDate: targetDate, businessContent: '本日の業務内容', submittedAt: `${targetDate}T09:02:00+09:00` },
  ];

  const nonSubmittedReporters = [
    { userId: 'user-004', userName: 'reporter-004', reporterName: '田中太郎', lastSubmissionDate: '2024-01-14' },
    { userId: 'user-005', userName: 'reporter-005', reporterName: '鈴木花子', lastSubmissionDate: null },
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
        detectionLogId: 'LOG-047-001',
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

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-LEADER-047-001',
      sentAt: new Date(`${targetDate}T18:05:00+09:00`),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: nonSubmittedReporters.length,
      errorDetails: null,
    });

    mockedSendNonSubmissionPromptNotification.mockResolvedValue(true);

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      submittedReports: submittedDailyReports,
      nonSubmittedReporters,
      detectionLogs: [],
      emailSendingHistory: [],
      submissionStatusSummary: {
        submittedCount: submittedDailyReports.length,
        nonSubmittedCount: nonSubmittedReporters.length,
        submissionRate: 60,
        promptedCount: nonSubmittedReporters.length,
      },
      progressSummaryText: '提出率：60%（3/5）、未提出者：2名（田中太郎、鈴木花子）',
    });
  });

  it('未提出者2名の詳細情報がnonSubmittedReportersに含まれ、催促メールが2件送信される', async () => {
    const result = await runTx4Imp1Agent({
      targetDate,
      leaderUserId,
      teamId,
    });

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe(targetDate);
    expect(result.submittedReportCount).toBe(3);
    expect(result.nonSubmittedReporterCount).toBe(2);
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters).toEqual([
      { userId: 'user-004', userName: 'reporter-004', reporterName: '田中太郎', lastSubmissionDate: '2024-01-14' },
      { userId: 'user-005', userName: 'reporter-005', reporterName: '鈴木花子', lastSubmissionDate: null },
    ]);
    expect(result.promptNotificationsSent).toBe(2);
    expect(result.promptNotificationsFailed).toBe(0);
    expect(result.progressSummary).toContain('提出率：60%（3/5）、未提出者：2名（田中太郎、鈴木花子）');
    expect(result.leaderNotificationSent).toBe(true);
    expect(typeof result.detectionLogId).toBe('string');
    expect(result.detectionLogId.length).toBeGreaterThan(0);
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
    expect(result.errors ?? []).toEqual([]);
  });
});
