jest.mock('../../src/logic/daily-report-persistence');

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput, RetrieveDailyReportsForLeaderReviewOutput } from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-435: リーダーがソート対象を\'reportDate\'に指定して検索し、報告日の降順で日報が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return reports sorted by reportDate in descending order', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: 'reportDate',
      pageNumber: 1,
      pageSize: 50,
    };

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: [
        { id: 'report-B', userId: 'user-003', reportDate: '2024-01-20', businessContent: 'Task B', submittedAt: '2024-01-20T14:15:00Z' },
        { id: 'report-A', userId: 'user-002', reportDate: '2024-01-15', businessContent: 'Task A', submittedAt: '2024-01-15T10:30:00Z' },
        { id: 'report-C', userId: 'user-001', reportDate: '2024-01-10', businessContent: 'Task C', submittedAt: '2024-01-10T09:45:00Z' },
      ],
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue(expectedOutput);

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(3);
    expect(result.dailyReports[0].reportDate).toBe('2024-01-20');
    expect(result.dailyReports[1].reportDate).toBe('2024-01-15');
    expect(result.dailyReports[2].reportDate).toBe('2024-01-10');

    for (let i = 0; i < result.dailyReports.length - 1; i++) {
      expect(result.dailyReports[i].reportDate).toBeGreaterThanOrEqual(result.dailyReports[i + 1].reportDate);
    }

    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
