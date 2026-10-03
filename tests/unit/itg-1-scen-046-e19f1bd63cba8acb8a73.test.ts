import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as reporterMaster from '../../src/logic/reporter-master-management';
import * as dailyReportReminder from '../../src/logic/daily-report-reminder-notification';
import * as businessDayJudgment from '../../src/logic/business-day-deadline-judgment';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as nonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecision from '../../src/logic/non-submission-prompt-decision';
import * as emailNotification from '../../src/logic/email-notification-management';
import * as dashboardLogic from '../../src/logic/daily-report-management-view';

describe('SCEN-046: teamIdが指定された場合、そのチームの報告者のみを対象に処理が実行される', () => {
  let getActiveReportersSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(businessDayJudgment, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isBusinessDay: true,
      submissionDeadlineForTargetDate: '2025-01-15T17:00:00Z',
    } as any);

    getActiveReportersSpy = jest.spyOn(reporterMaster, 'getActiveReportersForSubmissionCheck').mockResolvedValue({
      reporters: [
        { userId: 'reporter-001', userName: 'user-001' },
        { userId: 'reporter-002', userName: 'user-002' },
        { userId: 'reporter-003', userName: 'user-003' },
      ],
    } as any);

    jest.spyOn(dailyReportPersistence, 'retrieveDailyReportsForLeaderReview').mockResolvedValue({
      reports: [
        { reportId: 'report-001', userId: 'reporter-001' },
        { reportId: 'report-002', userId: 'reporter-002' },
      ],
      totalCount: 2,
    } as any);

    jest.spyOn(nonSubmissionDetection, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'reporter-003', userName: 'user-003', reporterName: 'user-003', lastSubmissionDate: null },
      ],
      detectionLog: { detectionLogId: 'detection-log-001' },
    } as any);

    jest.spyOn(promptDecision, 'judgePromptNecessityAndMethod').mockResolvedValue({
      promptNecessary: true,
      method: 'email',
    } as any);

    jest.spyOn(emailNotification, 'sendNonSubmissionPromptNotification').mockResolvedValue({
      sent: 1,
      failed: 0,
      success: true,
      totalTargets: 1,
      successCount: 1,
      failureCount: 0,
    } as any);

    jest.spyOn(dailyReportReminder, 'sendLeaderNonSubmissionPromptNotification').mockResolvedValue({
      success: true,
    } as any);

    jest.spyOn(dashboardLogic, 'retrieveLeaderDashboardData').mockResolvedValue({
      progressSummary: '提出率66.7%、未提出者1名、主要課題情報',
    } as any);
  });

  test('teamIdが指定されたテストケースで、そのチームの報告者のみを対象に処理が実行される', async () => {
    const targetDate = '2025-01-15';
    const leaderUserId = 'leader-001';
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

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe('2025-01-15');
    expect(result.submittedReportCount).toBe(2);
    expect(result.nonSubmittedReporterCount).toBe(1);
    expect(result.nonSubmittedReporters).toHaveLength(1);
    expect(result.nonSubmittedReporters[0]?.userId).toBe('reporter-003');
    expect(result.promptNotificationsSent).toBe(1);
    expect(result.promptNotificationsFailed).toBe(0);
    expect(result.progressSummary).toContain('66.7%');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(getActiveReportersSpy).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'team-A' }));
  });
});
