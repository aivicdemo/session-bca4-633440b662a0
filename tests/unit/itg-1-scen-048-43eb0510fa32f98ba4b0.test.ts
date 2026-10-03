import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as businessDayJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMaster from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as nonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecision from '../../src/logic/non-submission-prompt-decision';
import * as dailyReportReminder from '../../src/logic/daily-report-reminder-notification';
import * as emailNotification from '../../src/logic/email-notification-management';
import * as dashboardLogic from '../../src/logic/daily-report-management-view';

describe('SCEN-048: 処理中に複数のエラーが発生した場合', () => {
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
      ],
    } as any);

    jest.spyOn(dailyReportPersistence, 'retrieveDailyReportsForLeaderReview').mockRejectedValue(
      new Error('DailyReportAnalysisFailed: 日報の自動解析処理に失敗しました。')
    );

    jest.spyOn(nonSubmissionDetection, 'detectNonSubmittedReportersAtDeadline').mockRejectedValue(
      new Error('NonSubmissionDetectionFailed: 未提出者の検知に失敗しました。')
    );

    jest.spyOn(promptDecision, 'judgePromptNecessityAndMethod').mockResolvedValue({
      promptNecessary: true,
      method: 'email',
    } as any);

    jest.spyOn(dailyReportReminder, 'sendLeaderNonSubmissionPromptNotification').mockRejectedValue(
      new Error('PromptNotificationSendingFailed: 未提出者への催促メール送信に失敗しました。')
    );

    jest.spyOn(emailNotification, 'sendNonSubmissionPromptNotification').mockRejectedValue(
      new Error('LeaderNotificationFailed: リーダーへの通知送信に失敗しました。')
    );

    jest.spyOn(dashboardLogic, 'retrieveLeaderDashboardData').mockRejectedValue(
      new Error('ProgressSummaryGenerationFailed: チーム進捗サマリーの生成に失敗しました。')
    );
  });

  test('処理中に複数のエラーが発生した場合、executionStatusはpartial_failureになりerrorsフィールドにすべてのエラーが記録される', async () => {
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
    expect(result.targetDate).toBe('2025-01-15');
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});
