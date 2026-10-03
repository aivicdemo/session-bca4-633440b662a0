import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportNonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as nonSubmissionPromptDecision from '../../src/logic/non-submission-prompt-decision';
import * as dailyReportReminderNotification from '../../src/logic/daily-report-reminder-notification';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';

describe('SCEN-058: 遅延提出者が存在しない場合、出力に空配列が記録されて正常完了する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete successfully with empty delayed reporters', async () => {
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
      nonSubmitted: [],
      delayed: [],
    });
    jest.spyOn(nonSubmissionPromptDecision, 'judgePromptNecessityAndMethod' as any).mockResolvedValue([]);
    jest.spyOn(dailyReportReminderNotification, 'sendLeaderNonSubmissionPromptNotification' as any).mockResolvedValue({
      status: 'sent',
    });
    jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate' as any).mockResolvedValue({
      detectionLogId: 'detection-log-20240115-001',
    });

    const input = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '2024-01-15T18:00:00Z',
        executedBy: 'system-scheduler',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.detectionLogId).toBe('detection-log-20240115-001');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.errorDetails).toBeNull();
  });
});
