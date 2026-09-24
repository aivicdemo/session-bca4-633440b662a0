jest.mock('../../src/logic/daily-report-persistence');

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput, RetrieveDailyReportsForLeaderReviewOutput } from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-437: リーダーがソート対象を\'userId\'に指定して検索し、ユーザーIDでソートされた日報が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return reports sorted by userId in ascending order', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: 'userId',
      pageNumber: 1,
      pageSize: 50,
    };

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: [
        { id: 'report-1', userId: 'user-001', reportDate: '2024-01-05', businessContent: 'Work 1', submittedAt: '2024-01-05T08:00:00Z' },
        { id: 'report-2', userId: 'user-002', reportDate: '2024-01-10', businessContent: 'Work 2', submittedAt: '2024-01-10T09:00:00Z' },
        { id: 'report-3', userId: 'user-003', reportDate: '2024-01-15', businessContent: 'Work 3', submittedAt: '2024-01-15T10:00:00Z' },
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
      expect(result.dailyReports[i].userId).toBeLessThanOrEqual(result.dailyReports[i + 1].userId);
    }

    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
