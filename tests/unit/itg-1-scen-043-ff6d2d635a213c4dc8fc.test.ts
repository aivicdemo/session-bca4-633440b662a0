import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as emailNotification from '../../src/logic/email-notification-management';
import * as dailyReportReminder from '../../src/logic/daily-report-reminder-notification';
import * as businessDayJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMaster from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as nonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecision from '../../src/logic/non-submission-prompt-decision';
import * as dashboardLogic from '../../src/logic/daily-report-management-view';

describe('SCEN-043: 催促メール送信に一部失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(businessDayJudgment, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isBusinessDay: true,
      submissionDeadlineForTargetDate: '2025-01-15T17:00:00Z',
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
        { reportId: 'report-001', userId: 'reporter-001', submittedAt: '2025-01-15T16:00:00Z' },
        { reportId: 'report-002', userId: 'reporter-002', submittedAt: '2025-01-15T16:30:00Z' },
      ],
      totalCount: 2,
    } as any);

    jest.spyOn(nonSubmissionDetection, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'reporter-003', userName: 'user-003', reporterName: '太郎', lastSubmissionDate: '2025-01-14' },
        { userId: 'reporter-004', userName: 'user-004', reporterName: '次郎', lastSubmissionDate: '2025-01-14' },
        { userId: 'reporter-005', userName: 'user-005', reporterName: '三郎', lastSubmissionDate: null },
      ],
      detectionLog: { detectionLogId: 'detection-log-001' },
    } as any);

    jest.spyOn(promptDecision, 'judgePromptNecessityAndMethod').mockResolvedValue({
      promptNecessary: true,
      method: 'email',
    } as any);

    jest.spyOn(dailyReportReminder, 'sendLeaderNonSubmissionPromptNotification').mockResolvedValue({
      success: true,
    } as any);

    jest.spyOn(dashboardLogic, 'retrieveLeaderDashboardData').mockResolvedValue({
      progressSummary: 'チーム進捗サマリー',
    } as any);

    let callCount = 0;
    jest.spyOn(emailNotification, 'sendNonSubmissionPromptNotification').mockImplementation(async () => {
      callCount++;
      if (callCount === 2) {
        throw new Error('PromptNotificationSendingFailed: メール送信に失敗しました');
      }
      return { sent: 1, failed: 0, success: true, totalTargets: 1, successCount: 1, failureCount: 0 } as any;
    });
  });

  test('催促メール送信に一部失敗した場合、executionStatusはpartial_failureになり失敗件数がpromptNotificationsFailedに記録される', async () => {
    const targetDate = '2025-01-15';
    const leaderUserId = 'leader-001';
    const teamId = 'team-001';

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
    expect(result.promptNotificationsFailed).toBe(1);
    expect(result.promptNotificationsSent).toBe(2);
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.detectionLogId).toBe('detection-log-001');
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThanOrEqual(1);
    expect(result.errors?.some((e: any) => e.code === 'PromptNotificationSendingFailed')).toBe(true);
  });
});
