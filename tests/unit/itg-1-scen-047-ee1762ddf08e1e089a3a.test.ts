import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as businessDayJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMaster from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as nonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecision from '../../src/logic/non-submission-prompt-decision';
import * as dailyReportReminder from '../../src/logic/daily-report-reminder-notification';
import * as emailNotification from '../../src/logic/email-notification-management';
import * as dashboardLogic from '../../src/logic/daily-report-management-view';

describe('SCEN-047: 一部の報告者が日報を未提出の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(businessDayJudgment, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isBusinessDay: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
    } as any);

    jest.spyOn(reporterMaster, 'getActiveReportersForSubmissionCheck').mockResolvedValue({
      reporters: [
        { userId: 'user-001', userName: 'reporter-001' },
        { userId: 'user-002', userName: 'reporter-002' },
        { userId: 'user-003', userName: 'reporter-003' },
        { userId: 'user-004', userName: 'reporter-004' },
        { userId: 'user-005', userName: 'reporter-005' },
      ],
    } as any);

    jest.spyOn(dailyReportPersistence, 'retrieveDailyReportsForLeaderReview').mockResolvedValue({
      reports: [
        { reportId: 'report-001', userId: 'user-001' },
        { reportId: 'report-002', userId: 'user-002' },
        { reportId: 'report-003', userId: 'user-003' },
      ],
      totalCount: 3,
    } as any);

    jest.spyOn(nonSubmissionDetection, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      nonSubmittedReporters: [
        {
          userId: 'user-004',
          userName: 'reporter-004',
          reporterName: '田中太郎',
          lastSubmissionDate: '2024-01-14',
        },
        {
          userId: 'user-005',
          userName: 'reporter-005',
          reporterName: '鈴木花子',
          lastSubmissionDate: null,
        },
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

    jest.spyOn(emailNotification, 'sendNonSubmissionPromptNotification').mockResolvedValue({
      sent: 2,
      failed: 0,
      success: true,
      totalTargets: 2,
      successCount: 2,
      failureCount: 0,
    } as any);

    jest.spyOn(dashboardLogic, 'retrieveLeaderDashboardData').mockResolvedValue({
      progressSummary: '提出率：60%（3/5）、未提出者：2名（田中太郎、鈴木花子）',
    } as any);
  });

  test('一部の報告者が日報を未提出の場合、nonSubmittedReportersに詳細情報が含まれ催促メールが送信される', async () => {
    const targetDate = '2024-01-15';
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
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.submittedReportCount).toBe(3);
    expect(result.nonSubmittedReporterCount).toBe(2);
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0]).toEqual({
      userId: 'user-004',
      userName: 'reporter-004',
      reporterName: '田中太郎',
      lastSubmissionDate: '2024-01-14',
    });
    expect(result.nonSubmittedReporters[1]).toEqual({
      userId: 'user-005',
      userName: 'reporter-005',
      reporterName: '鈴木花子',
      lastSubmissionDate: null,
    });
    expect(result.promptNotificationsSent).toBe(2);
    expect(result.promptNotificationsFailed).toBe(0);
    expect(result.progressSummary).toContain('60%');
    expect(result.leaderNotificationSent).toBe(true);
  });
});
