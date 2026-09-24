jest.mock('../../src/logic/daily-report-persistence');

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput, RetrieveDailyReportsForLeaderReviewOutput } from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-434: リーダーが提出状態を\'all\'に指定して検索し、全ての日報が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return all reports submitted and draft when filterBySubmissionStatus is all', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'all',
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: [
        { id: 'report-001', userId: 'user-001', reportDate: '2024-01-05', businessContent: 'Content 1', submittedAt: '2024-01-05T08:00:00Z' },
        { id: 'report-002', userId: 'user-002', reportDate: '2024-01-10', businessContent: 'Content 2', submittedAt: '2024-01-10T09:00:00Z' },
        { id: 'report-003', userId: 'user-003', reportDate: '2024-01-15', businessContent: 'Content 3', submittedAt: undefined },
        { id: 'report-004', userId: 'user-001', reportDate: '2024-01-20', businessContent: 'Content 4', submittedAt: '2024-01-20T10:00:00Z' },
      ],
      totalCount: 4,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue(expectedOutput);

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(4);
    expect(result.dailyReports.every((r) => r.businessContent !== undefined)).toBe(true);
    expect(result.totalCount).toBe(4);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
