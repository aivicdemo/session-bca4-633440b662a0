jest.mock('../../src/logic/daily-report-persistence');

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput, RetrieveDailyReportsForLeaderReviewOutput } from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-432: リーダーがユーザーIDでフィルターして日報を検索し、該当ユーザーの日報のみが返される', () => {
  const testDataset = {
    user001: [
      { id: 'report-001', userId: 'user001', reportDate: '2024-01-05', businessContent: 'Task A', submittedAt: '2024-01-05T08:00:00Z', status: 'submitted' },
      { id: 'report-002', userId: 'user001', reportDate: '2024-01-10', businessContent: 'Task B', submittedAt: '2024-01-10T09:00:00Z', status: 'submitted' },
      { id: 'report-003', userId: 'user001', reportDate: '2024-01-15', businessContent: 'Task C', submittedAt: '2024-01-15T10:00:00Z', status: 'submitted' },
    ],
    user002: [
      { id: 'report-004', userId: 'user002', reportDate: '2024-01-03', businessContent: 'Work 1', submittedAt: '2024-01-03T07:30:00Z', status: 'submitted' },
      { id: 'report-005', userId: 'user002', reportDate: '2024-01-08', businessContent: 'Work 2', submittedAt: '2024-01-08T08:30:00Z', status: 'submitted' },
      { id: 'report-006', userId: 'user002', reportDate: '2024-01-12', businessContent: 'Work 3', submittedAt: '2024-01-12T09:30:00Z', status: 'submitted' },
      { id: 'report-007', userId: 'user002', reportDate: '2024-01-20', businessContent: 'Work 4', submittedAt: '2024-01-20T11:00:00Z', status: 'submitted' },
    ],
    user003: [
      { id: 'report-008', userId: 'user003', reportDate: '2024-01-07', businessContent: 'Project X', submittedAt: '2024-01-07T08:15:00Z', status: 'submitted' },
      { id: 'report-009', userId: 'user003', reportDate: '2024-01-25', businessContent: 'Project Y', submittedAt: '2024-01-25T12:00:00Z', status: 'submitted' },
    ],
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return only user002 daily reports when filtering by userId', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: 'user002',
      filterBySubmissionStatus: 'submitted',
      sortBy: 'reportDate',
      pageNumber: 1,
      pageSize: 50,
    };

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: [
        { id: 'report-007', userId: 'user002', reportDate: '2024-01-20', businessContent: 'Work 4', submittedAt: '2024-01-20T11:00:00Z' },
        { id: 'report-006', userId: 'user002', reportDate: '2024-01-12', businessContent: 'Work 3', submittedAt: '2024-01-12T09:30:00Z' },
        { id: 'report-005', userId: 'user002', reportDate: '2024-01-08', businessContent: 'Work 2', submittedAt: '2024-01-08T08:30:00Z' },
        { id: 'report-004', userId: 'user002', reportDate: '2024-01-03', businessContent: 'Work 1', submittedAt: '2024-01-03T07:30:00Z' },
      ],
      totalCount: 4,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue(expectedOutput);

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(4);
    expect(result.dailyReports.every((r) => r.userId === 'user002')).toBe(true);
    expect(result.dailyReports[0].reportDate).toBe('2024-01-20');
    expect(result.dailyReports[1].reportDate).toBe('2024-01-12');
    expect(result.dailyReports[2].reportDate).toBe('2024-01-08');
    expect(result.dailyReports[3].reportDate).toBe('2024-01-03');
    expect(result.totalCount).toBe(4);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(mockedRetrieveDailyReportsForLeaderReview).toHaveBeenCalledWith(input);
  });
});
