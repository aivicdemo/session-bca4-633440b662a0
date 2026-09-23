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
    { reporterId: 'R001', userId: 'U001', userName: '報告者1', reporterName: '報告者1', emailAddress: 'u001@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R002', userId: 'U002', userName: '報告者2', reporterName: '報告者2', emailAddress: 'u002@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R003', userId: 'U003', userName: '報告者3', reporterName: '報告者3', emailAddress: 'u003@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R004', userId: 'U004', userName: '報告者4', reporterName: '報告者4', emailAddress: 'u004@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R005', userId: 'U005', userName: '報告者5', reporterName: '報告者5', emailAddress: 'u005@example.com', department: '営業部', status: 'active' },
  ];

  const submittedDailyReports = activeReporters.slice(0, 3).map((r, i) => ({
    dailyReportId: `DR-04${i + 1}`,
    userId: r.userId,
    reportDate: targetDate,
    businessContent: '本日の業務内容',
    submittedAt: `${targetDate}T09:0${i}:00+09:00`,
  }));

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: `${targetDate}T17:00:00+09:00`,
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: activeReporters,
      totalCount: activeReporters.length,
      message: '有効な報告者を取得しました。',
    });

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      dailyReports: submittedDailyReports,
      totalCount: submittedDailyReports.length,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: `${targetDate}T18:00:00+09:00`,
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockRejectedValue(
      new Error('未提出者検知に失敗しました')
    );
  });

  it('executionStatusがfailureとなり、NonSubmissionDetectionFailedエラーがerrorsに含まれる', async () => {
    const result = await runTx4Imp1Agent({
      targetDate,
      leaderUserId,
      teamId,
    });

    expect(result.executionStatus).toBe('failure');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'NonSubmissionDetectionFailed',
          message: '未提出者の検知に失敗しました。',
        }),
      ])
    );

    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
  });
});
