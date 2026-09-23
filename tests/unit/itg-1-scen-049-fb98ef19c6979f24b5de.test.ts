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

describe('SCEN-049: 報告者マスタの人事異動による更新が反映されていない場合でも、現在有効な報告者のみを対象として処理される', () => {
  const leaderUserId = 'leader-001';
  const teamId = 'team-001';

  const activeReporters = [
    { reporterId: 'RA', userId: 'userA', userName: 'ユーザーA', reporterName: 'ユーザーA', emailAddress: 'userA@example.com', department: '営業部', status: 'active' },
    { reporterId: 'RB', userId: 'userB', userName: 'ユーザーB', reporterName: 'ユーザーB', emailAddress: 'userB@example.com', department: '営業部', status: 'active' },
    { reporterId: 'RD', userId: 'userD', userName: 'ユーザーD', reporterName: 'ユーザーD', emailAddress: 'userD@example.com', department: '営業部', status: 'active' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: activeReporters,
      totalCount: activeReporters.length,
      message: '有効な報告者を取得しました。',
    });
  });

  it('非営業日ではTargetDateNotBusinessDayエラーで失敗し、営業日では無効な報告者Cを除外して処理される', async () => {
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: false,
      isBusinessDay: false,
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: null,
      processingPolicy: 'reject',
      rejectionReason: '対象日は営業日ではありません。',
    });

    const firstResult = await runTx4Imp1Agent({
      targetDate: '2024-01-13',
      leaderUserId,
      teamId,
    });

    expect(firstResult.executionStatus).toBe('failure');
    expect(firstResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'TargetDateNotBusinessDay',
          message: '対象日が営業日ではないため処理を実行できません。',
        }),
      ])
    );

    const targetDate = '2024-01-15';

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: `${targetDate}T17:00:00+09:00`,
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      dailyReports: [
        { dailyReportId: 'DR-049-1', userId: 'userA', reportDate: targetDate, businessContent: '本日の業務内容', submittedAt: `${targetDate}T09:00:00+09:00` },
        { dailyReportId: 'DR-049-2', userId: 'userB', reportDate: targetDate, businessContent: '本日の業務内容', submittedAt: `${targetDate}T09:01:00+09:00` },
      ],
      totalCount: 2,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: `${targetDate}T18:00:00+09:00`,
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'userD', userName: 'ユーザーD', reporterName: 'ユーザーD', lastSubmissionDate: '2024-01-14' },
      ],
      detectionLog: {
        detectionLogId: 'LOG-049-001',
        targetDate,
        detectionDateTime: `${targetDate}T18:00:00+09:00`,
        totalReportersCount: activeReporters.length,
        nonSubmittedCount: 1,
        submittedCount: 2,
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

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-LEADER-049-001',
      sentAt: new Date(`${targetDate}T18:05:00+09:00`),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 1,
      errorDetails: null,
    });

    mockedSendNonSubmissionPromptNotification.mockResolvedValue(true);

    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      submittedReports: [],
      nonSubmittedReporters: [
        { userId: 'userD', userName: 'ユーザーD', reporterName: 'ユーザーD', lastSubmissionDate: '2024-01-14' },
      ],
      detectionLogs: [],
      emailSendingHistory: [],
      submissionStatusSummary: {
        submittedCount: 2,
        nonSubmittedCount: 1,
        submissionRate: 66.7,
        promptedCount: 1,
      },
      progressSummaryText: '提出率66.7%、未提出者1名（ユーザーD）',
    });

    const secondResult = await runTx4Imp1Agent({
      targetDate,
      leaderUserId,
      teamId,
    });

    expect(secondResult.executionStatus).toBe('success');
    expect(secondResult.submittedReportCount).toBe(2);
    expect(secondResult.nonSubmittedReporterCount).toBe(1);
    expect(secondResult.nonSubmittedReporters).toHaveLength(1);
    expect(secondResult.nonSubmittedReporters).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: 'userD' })])
    );
    expect(
      JSON.stringify(secondResult.nonSubmittedReporters)
    ).not.toContain('userC');
    expect(secondResult.promptNotificationsSent).toBe(1);
    expect(secondResult.promptNotificationsFailed).toBe(0);
    expect(secondResult.leaderNotificationSent).toBe(true);
    expect(typeof secondResult.detectionLogId).toBe('string');
    expect(secondResult.detectionLogId.length).toBeGreaterThan(0);
    expect(secondResult.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
    expect(secondResult.errors ?? []).toEqual([]);

    expect(mockedGetActiveReportersForSubmissionCheck).toHaveBeenCalled();
  });
});
