jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));

import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';

const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;

describe('SCEN-042: 未提出者検知処理が失敗した場合、NonSubmissionDetectionFailedエラーが発生しexecutionStatusはfailureになる', () => {
  const targetDate = '2024-01-15';
  const leaderUserId = 'leader-001';
  const teamId = 'team-001';

  const activeReporters = [
    { userId: 'user-001', userName: 'reporter-001', reporterName: '報告者1' },
    { userId: 'user-002', userName: 'reporter-002', reporterName: '報告者2' },
    { userId: 'user-003', userName: 'reporter-003', reporterName: '報告者3' },
    { userId: 'user-004', userName: 'reporter-004', reporterName: '報告者4' },
    { userId: 'user-005', userName: 'reporter-005', reporterName: '報告者5' },
  ];

  const submittedReports = [
    { userId: 'user-001', submissionTimestamp: '2024-01-15T16:30:00+09:00' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      deadline: '2024-01-15T17:00:00+09:00',
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      reporters: activeReporters,
      count: 5,
    });

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      reports: submittedReports,
      count: 1,
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockRejectedValue(
      new Error('未提出者検知に失敗しました')
    );
  });

  it('should return failure status with NonSubmissionDetectionFailed error', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.executionStatus).toBe('failure');
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    
    const error = result.errors.find((e: any) => e.code === 'NonSubmissionDetectionFailed');
    expect(error).toBeDefined();
    expect(error.message).toContain('未提出者の検知に失敗しました');
  });

  it('should record execution timestamp even on failure', async () => {
    const fakeAiClient = {};

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      fakeAiClient
    );

    expect(result.executionTimestamp).toBeTruthy();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.executionTimestamp)).toBe(true);
  });
});
