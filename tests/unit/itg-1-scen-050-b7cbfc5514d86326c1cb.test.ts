import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportNonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as nonSubmissionPromptDecision from '../../src/logic/non-submission-prompt-decision';
import * as dailyReportReminderNotification from '../../src/logic/daily-report-reminder-notification';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-050: 定時スケジューラ実行タイミングが正常で、未提出者と遅延者を正しく判定し、催促メール送信と検知ログ記録が完了する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute successfully with non-submitted and delayed reporters', async () => {
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
          targetDate: '2024-01-15',
          detectionTime: '2024-01-15T17:00:30Z',
        },
        {
          userId: 'U002',
          userName: 'Reporter B',
          reporterName: 'Report B',
          targetDate: '2024-01-15',
          detectionTime: '2024-01-15T17:00:30Z',
        },
      ],
      delayed: [
        {
          userId: 'U003',
          userName: 'Reporter C',
          reporterName: 'Report C',
          submissionTime: '2024-01-15T17:15:45Z',
          delayMinutes: 15,
        },
      ],
    });
    jest.spyOn(nonSubmissionPromptDecision, 'judgePromptNecessityAndMethod' as any).mockResolvedValue([
      { userId: 'U001', notificationType: 'non_submission_alert' },
      { userId: 'U002', notificationType: 'non_submission_alert' },
      { userId: 'U003', notificationType: 'delayed_submission_alert' },
    ]);
    jest.spyOn(dailyReportReminderNotification, 'sendLeaderNonSubmissionPromptNotification' as any).mockResolvedValue({
      promptNotificationsSent: [
        { userId: 'U001', notificationType: 'non_submission_alert', sentAt: '2024-01-15T17:01:00Z', status: 'sent' },
        { userId: 'U002', notificationType: 'non_submission_alert', sentAt: '2024-01-15T17:01:01Z', status: 'sent' },
        { userId: 'U003', notificationType: 'delayed_submission_alert', sentAt: '2024-01-15T17:01:02Z', status: 'sent' },
      ],
    });
    jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate' as any).mockResolvedValue({
      detectionLogId: 'DL-20240115-001',
      leaderNotificationSent: true,
    });

    const input = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '2024-01-15T17:00:00Z',
        executedBy: 'scheduler-system',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.nonSubmittedReporters).toEqual([
      {
        userId: 'U001',
        userName: 'Reporter A',
        reporterName: 'Report A',
        targetDate: '2024-01-15',
        detectionTime: '2024-01-15T17:00:30Z',
      },
      {
        userId: 'U002',
        userName: 'Reporter B',
        reporterName: 'Report B',
        targetDate: '2024-01-15',
        detectionTime: '2024-01-15T17:00:30Z',
      },
    ]);
    expect(result.delayedReporters).toEqual([
      {
        userId: 'U003',
        userName: 'Reporter C',
        reporterName: 'Report C',
        submissionTime: '2024-01-15T17:15:45Z',
        delayMinutes: 15,
      },
    ]);
    expect(result.promptNotificationsSent).toHaveLength(3);
    expect(result.promptNotificationsSent?.every((n) => n.status === 'sent')).toBe(true);
    expect(result.detectionLogId).toBe('DL-20240115-001');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.errorDetails).toBeNull();
  });
});
