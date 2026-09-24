jest.mock('../../src/logic/daily-report-persistence');

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput, RetrieveDailyReportsForLeaderReviewOutput } from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-433: リーダーが提出状態を\'submitted\'に指定して検索し、提出済み日報だけが返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return only submitted reports when filterBySubmissionStatus is submitted', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-14',
      endDate: '2024-01-15',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: [
        { id: 'report-001', userId: 'userA', reportDate: '2024-01-15', businessContent: 'Work A', submittedAt: '2024-01-15T09:30:00Z' },
        { id: 'report-002', userId: 'userB', reportDate: '2024-01-15', businessContent: 'Work B', submittedAt: '2024-01-15T10:45:00Z' },
        { id: 'report-003', userId: 'userA', reportDate: '2024-01-14', businessContent: 'Work C', submittedAt: '2024-01-14T18:20:00Z' },
      ],
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue(expectedOutput);

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(3);
    expect(result.dailyReports.every((r) => r.submittedAt !== undefined && r.submittedAt !== null)).toBe(true);
    expect(result.dailyReports).not.toContainEqual(expect.objectContaining({ userId: 'userC' }));
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
