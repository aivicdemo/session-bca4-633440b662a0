import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as emailNotification from '../../src/logic/email-notification-management';
import * as dailyReportReminder from '../../src/logic/daily-report-reminder-notification';
import * as businessDayJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMaster from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as nonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecision from '../../src/logic/non-submission-prompt-decision';
import * as dashboardLogic from '../../src/logic/daily-report-management-view';

describe('SCEN-045: リーダーへの進捗サマリー通知送信に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(businessDayJudgment, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isBusinessDay: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
    } as any);

    jest.spyOn(reporterMaster, 'getActiveReportersForSubmissionCheck').mockResolvedValue({
      reporters: [
        { userId: 'reporter-001', userName: 'user-001' },
        { userId: 'reporter-002', userName: 'user-002' },
        { userId: 'reporter-003', userName: 'user-003' },
        { userId: 'reporter-004', userName: 'user-004' },
        { userId: 'reporter-005', userName: 'user-005' },
      ],
    } as any);

    jest.spyOn(dailyReportPersistence, 'retrieveDailyReportsForLeaderReview').mockResolvedValue({
      reports: [
        { reportId: 'report-001', userId: 'reporter-001' },
        { reportId: 'report-002', userId: 'reporter-002' },
        { reportId: 'report-003', userId: 'reporter-003' },
      ],
      totalCount: 3,
    } as any);

    jest.spyOn(nonSubmissionDetection, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'user-A', userName: 'reporter-A', reporterName: 'ユーザーA', lastSubmissionDate: '2024-01-14' },
        { userId: 'user-B', userName: 'reporter-B', reporterName: 'ユーザーB', lastSubmissionDate: null },
      ],
      detectionLog: { detectionLogId: 'log-001' },
    } as any);

    jest.spyOn(promptDecision, 'judgePromptNecessityAndMethod').mockResolvedValue({
      promptNecessary: true,
      method: 'email',
    } as any);

    jest.spyOn(emailNotification, 'sendNonSubmissionPromptNotification').mockResolvedValue({
      sent: 2,
      failed: 0,
      success: true,
      totalTargets: 2,
      successCount: 2,
      failureCount: 0,
    } as any);

    jest.spyOn(dailyReportReminder, 'sendLeaderNonSubmissionPromptNotification').mockRejectedValue(
      new Error('LeaderNotificationFailed: リーダーへの通知送信に失敗しました。')
    );

    jest.spyOn(dashboardLogic, 'retrieveLeaderDashboardData').mockResolvedValue({
      progressSummary: '提出率60%、未提出者2名：ユーザーA（最終提出:2024-01-14）、ユーザーB（未提出）、主要課題：進捗遅延',
    } as any);
  });

  test('リーダーへの進捗サマリー通知送信に失敗した場合、LeaderNotificationFailedエラーが発生しleaderNotificationSentはfalseになる', async () => {
    const targetDate = '2024-01-15';
    const leaderUserId = 'leader001';
    const teamId = 'team-A';

    const mockAiClient: Tx4Imp1AiClient = {
      invokeModel: jest.fn().mockResolvedValue(''),
    };

    const result = await runTx4Imp1Agent(
      {
        targetDate,
        leaderUserId,
        teamId,
      },
      mockAiClient
    );

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.submittedReportCount).toBe(3);
    expect(result.nonSubmittedReporterCount).toBe(2);
    expect(result.promptNotificationsSent).toBe(2);
    expect(result.promptNotificationsFailed).toBe(0);
    expect(result.progressSummary).toContain('60%');
    expect(result.errors).toBeDefined();
  });
});
