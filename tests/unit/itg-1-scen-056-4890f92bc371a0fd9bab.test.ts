import { runTx5Imp1Agent, Tx5Imp1AiClient, DetectionLogRecordingFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportNonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as nonSubmissionPromptDecision from '../../src/logic/non-submission-prompt-decision';
import * as dailyReportReminderNotification from '../../src/logic/daily-report-reminder-notification';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-056: 検知ログ記録に失敗してリーダーへの通知送信が途断する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return partial_failure when detection log recording fails', async () => {
    const mockAiClient: Tx5Imp1AiClient = {};

    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming' as any).mockResolvedValue(true);
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck' as any).mockResolvedValue([
      { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A' },
      { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B' },
      { userId: 'U003', userName: 'Reporter C', reporterName: 'Report C' },
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
      delayed: [],
    });
    jest.spyOn(nonSubmissionPromptDecision, 'judgePromptNecessityAndMethod' as any).mockResolvedValue([
      { userId: 'U001', notificationType: 'non_submission_alert' },
      { userId: 'U002', notificationType: 'non_submission_alert' },
    ]);
    jest.spyOn(dailyReportReminderNotification, 'sendLeaderNonSubmissionPromptNotification' as any).mockResolvedValue({
      status: 'sent',
    });
    jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate' as any).mockRejectedValue(
      new DetectionLogRecordingFailure('検知ログの記録に失敗しました。永続化層を確認してください。')
    );

    const input = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '09:00:00',
        executedBy: 'scheduler-service',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toBeDefined();
    expect(result.detectionLogId).toBeNull();
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.[0]).toMatchObject({
      step: '検知ログ記録',
      errorCode: 'DETECTION_LOG_RECORDING_FAILED',
      errorMessage: '検知ログの記録に失敗しました。永続化層を確認してください。',
    });
  });
});
