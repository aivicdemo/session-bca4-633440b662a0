import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportNonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as nonSubmissionPromptDecision from '../../src/logic/non-submission-prompt-decision';
import * as dailyReportReminderNotification from '../../src/logic/daily-report-reminder-notification';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-057: 未提出者が存在しない場合、出力に空配列が記録されて正常完了する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete successfully with empty non-submitted reporters', async () => {
    const mockAiClient: Tx5Imp1AiClient = {};

    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming' as any).mockResolvedValue(true);
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck' as any).mockResolvedValue([]);
    jest.spyOn(dailyReportNonSubmissionDetection, 'detectNonSubmittedReportersAtDeadline' as any).mockResolvedValue({
      nonSubmitted: [],
      delayed: [],
    });
    jest.spyOn(nonSubmissionPromptDecision, 'judgePromptNecessityAndMethod' as any).mockResolvedValue([]);
    jest.spyOn(dailyReportReminderNotification, 'sendLeaderNonSubmissionPromptNotification' as any).mockResolvedValue({
      status: 'sent',
    });
    jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate' as any).mockResolvedValue({
      detectionLogId: 'uuid-format-id',
    });

    const input = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '2024-01-15T17:00:00Z',
        executedBy: 'scheduler-id',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.detectionLogId).toBeDefined();
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.errorDetails).toBeNull();
  });
});
