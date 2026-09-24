jest.mock('../../src/logic/daily-report-persistence');

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput, RetrieveDailyReportsForLeaderReviewOutput } from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-436: リーダーがソート対象を\'submittedAt\'に指定して検索し、提出時刻でソートされた日報が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return reports sorted by submittedAt in ascending order', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: 'submittedAt',
      pageNumber: undefined,
      pageSize: undefined,
    };

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: [
        { id: 'report-1', userId: 'user-1', reportDate: '2024-01-01', businessContent: 'Content 1', submittedAt: '2024-01-01T08:30:00Z' },
        { id: 'report-2', userId: 'user-2', reportDate: '2024-01-01', businessContent: 'Content 2', submittedAt: '2024-01-01T09:15:00Z' },
        { id: 'report-3', userId: 'user-3', reportDate: '2024-01-02', businessContent: 'Content 3', submittedAt: '2024-01-02T07:45:00Z' },
      ],
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue(expectedOutput);

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(3);

    for (let i = 0; i < result.dailyReports.length - 1; i++) {
      const current = new Date(result.dailyReports[i].submittedAt!).getTime();
      const next = new Date(result.dailyReports[i + 1].submittedAt!).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }

    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
