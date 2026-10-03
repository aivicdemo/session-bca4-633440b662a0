import { runTx5Imp1Agent, Tx5Imp1AiClient, SubmissionStatusCheckFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportNonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-053: 日報提出状況の確認処理が失敗して未提出・遅延判定に進めない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail with SubmissionStatusCheckFailure when detection fails', async () => {
    const mockAiClient: Tx5Imp1AiClient = {};

    jest.spyOn(businessDayDeadlineJudgment, 'judgeSchedulerExecutionTiming' as any).mockResolvedValue(true);
    jest.spyOn(reporterMasterManagement, 'getActiveReportersForSubmissionCheck' as any).mockResolvedValue([
      { userId: 'U001', userName: 'Reporter A', reporterName: 'Report A' },
      { userId: 'U002', userName: 'Reporter B', reporterName: 'Report B' },
      { userId: 'U003', userName: 'Reporter C', reporterName: 'Report C' },
      { userId: 'U004', userName: 'Reporter D', reporterName: 'Report D' },
      { userId: 'U005', userName: 'Reporter E', reporterName: 'Report E' },
    ]);
    jest.spyOn(dailyReportNonSubmissionDetection, 'detectNonSubmittedReportersAtDeadline' as any).mockRejectedValue(
      new SubmissionStatusCheckFailure('日報提出状況の確認に失敗しました。システムログを確認してください。')
    );

    const input = {
      targetDate: '2024-01-15',
      executionContext: {
        scheduledAt: '09:00:00',
        executedBy: 'scheduler-system',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.[0]).toMatchObject({
      step: 'detectNonSubmittedReportersAtDeadline',
      errorCode: 'SubmissionStatusCheckFailure',
      errorMessage: '日報提出状況の確認に失敗しました。システムログを確認してください。',
    });
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.leaderNotificationSent).toBe(false);
    expect(result.detectionLogId).toBeNull();
  });
});
