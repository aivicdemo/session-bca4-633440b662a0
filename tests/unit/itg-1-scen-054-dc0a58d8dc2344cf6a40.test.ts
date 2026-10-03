import { runTx5Imp1Agent, Tx5Imp1AiClient, PromptDecisionFailure } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportNonSubmissionDetection from '../../src/logic/daily-report-non-submission-detection';
import * as nonSubmissionPromptDecision from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-054: 未提出・遅延の判定ロジックが失敗して催促メール送信に進めない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail with PromptDecisionFailure when judgment fails', async () => {
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
    jest.spyOn(nonSubmissionPromptDecision, 'judgePromptNecessityAndMethod' as any).mockRejectedValue(
      new PromptDecisionFailure('未提出・遅延の判定に失敗しました。業務ルール設定を確認してください。')
    );

    const input = {
      targetDate: '2025-01-15',
      executionContext: {
        scheduledAt: '2025-01-15T17:00:00Z',
        executedBy: 'system-scheduler',
      },
    };

    const result = await runTx5Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.promptNotificationsSent).toEqual([]);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.[0]).toMatchObject({
      step: '未提出・遅延判定',
      errorCode: 'PROMPT_DECISION_FAILED',
      errorMessage: '未提出・遅延の判定に失敗しました。業務ルール設定を確認してください。',
    });
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.delayedReporters).toEqual([]);
    expect(result.detectionLogId).toBeNull();
    expect(result.leaderNotificationSent).toBe(false);
  });
});
