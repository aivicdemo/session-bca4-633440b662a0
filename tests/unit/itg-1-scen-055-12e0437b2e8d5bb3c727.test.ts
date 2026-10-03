import { runTx5Imp1Agent, Tx5Imp1AiClient, PromptNotificationSendFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportNonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as nonSubmissionPromptDecision from '../../src/logic/non-submission-prompt-decision';
import * as dailyReportReminderNotification from '../../src/logic/daily-report-reminder-notification';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-055: 催促メール送信に失敗してもリーダー通知と検知ログ記録は実行され部分失敗で完了する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return partial_failure when prompt notification send fails but leader notification succeeds', async () => {
    const mockAiClient: Tx5Imp1AiClient = {};

    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming' as any).mockResolvedValue(true);
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck' as any).mockResolvedValue([
      { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A' },
      { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B' },
      { userId: 'U003', userName: 'Reporter C', reporterName: 'Report C' },
      { userId: 'U004', userName: 'Reporter D', reporterName: 'Report D' },
      { userId: 'U005', userName: 'Reporter E', reporterName: 'Report E' },
    ]);
    jest.spyOn(dailyReportNonSubmissionDetection, 'detectNonSubmittedReportersAtDeadline' as any).mockResolvedValue({
      nonSubmitted: [
        {
          userId: 'U001',
          userName: 'Reporter A',
          reporterName: 'Report A',
          targetDate: '2025-01-15',
          detectionTime: '2025-01-15T17:00:30Z',
        },
        {
          userId: 'U002',
          userName: 'Reporter B',
          reporterName: 'Report B',
          targetDate: '2025-01-15',
          detectionTime: '2025-01-15T17:00:30Z',
        },
      ],
      delayed: [],
    });
    jest.spyOn(nonSubmissionPromptDecision, 'judgePromptNecessityAndMethod' as any).mockResolvedValue([
      { userId: 'U001', notificationType: 'non_submission_alert' },
      { userId: 'U002', notificationType: 'non_submission_alert' },
    ]);
    jest.spyOn(dailyReportReminderNotification, 'sendLeaderNonSubmissionPromptNotification' as any).mockResolvedValue({
      promptNotificationsSent: [],
      status: 'sent',
    });
    jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate' as any).mockRejectedValue(
      new PromptNotificationSendFailure('催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。')
    );

    const input = {
      targetDate: '2025-01-15',
      executionContext: {
        scheduledAt: '2025-01-15T17:30:00Z',
        executedBy: 'scheduler-001',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.delayedReporters).toEqual([]);
    expect(result.detectionLogId).toBe('log-20250115-001');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.[0]).toMatchObject({
      step: 'PromptNotificationSendFailure',
      errorCode: 'PromptNotificationSendFailure',
      errorMessage: '催促メール送信に失敗しました。メール送信履歴を確認し、再送信を検討してください。',
    });
  });
});
