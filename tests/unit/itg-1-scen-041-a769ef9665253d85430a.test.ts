jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));

import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';

const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-041: 日報の自動解析に失敗した場合、DailyReportAnalysisFailedエラーが発生しexecutionStatusはfailureになる', () => {
  const targetDate = '2024-01-15';
  const leaderUserId = 'leader-001';
  const teamId = 'team-001';

  const activeReporters = [
    { userId: 'user-001', userName: 'reporter-001', reporterName: '報告者1' },
    { userId: 'user-002', userName: 'reporter-002', reporterName: '報告者2' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      deadline: '2024-01-15T17:00:00+09:00',
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      reporters: activeReporters,
      count: 2,
    });

    mockedRetrieveDailyReportsForLeaderReview.mockRejectedValue(
      new Error('Daily report analysis failed')
    );
  });

  it('should return failure status with DailyReportAnalysisFailed error', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.executionStatus).toBe('failure');
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    
    const error = result.errors.find((e: any) => e.code === 'DailyReportAnalysisFailed');
    expect(error).toBeDefined();
    expect(error.message).toContain('日報の自動解析処理に失敗しました');
  });

  it('should not include success fields when analysis fails', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.submittedReportCount).toBeUndefined();
    expect(result.nonSubmittedReporterCount).toBeUndefined();
    expect(result.nonSubmittedReporters).toBeUndefined();
    expect(result.promptNotificationsSent).toBeUndefined();
    expect(result.progressSummary).toBeUndefined();
    expect(result.leaderNotificationSent).toBeUndefined();
  });
});
