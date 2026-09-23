import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
  DailyReportForLeaderReview,
} from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/daily-report-persistence.ts');

describe('SCEN-433: リーダーが提出状態を\'submitted\'に指定して検索し、提出済み日報だけが返される', () => {
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
  });

  it('提出状態\'submitted\'でフィルタリングされた日報のみが返される', async () => {
    const testData: DailyReportForLeaderReview[] = [
      {
        id: 'report-001',
        userId: 'user-A',
        reportDate: '2024-01-15',
        content: 'Task 1',
        submittedAt: '2024-01-15T09:30:00Z',
      },
      {
        id: 'report-002',
        userId: 'user-B',
        reportDate: '2024-01-15',
        content: 'Task 2',
        submittedAt: '2024-01-15T10:45:00Z',
      },
      {
        id: 'report-003',
        userId: 'user-A',
        reportDate: '2024-01-14',
        content: 'Task 3',
        submittedAt: '2024-01-14T18:20:00Z',
      },
    ];

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: testData,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue(expectedOutput);

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

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(3);
    expect(result.dailyReports[0].userId).toBe('user-A');
    expect(result.dailyReports[0].reportDate).toBe('2024-01-15');
    expect(result.dailyReports[0].submittedAt).toBe('2024-01-15T09:30:00Z');

    expect(result.dailyReports[1].userId).toBe('user-B');
    expect(result.dailyReports[1].reportDate).toBe('2024-01-15');
    expect(result.dailyReports[1].submittedAt).toBe('2024-01-15T10:45:00Z');

    expect(result.dailyReports[2].userId).toBe('user-A');
    expect(result.dailyReports[2].reportDate).toBe('2024-01-14');
    expect(result.dailyReports[2].submittedAt).toBe('2024-01-14T18:20:00Z');

    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
