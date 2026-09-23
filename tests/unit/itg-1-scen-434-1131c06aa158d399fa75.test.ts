import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
  DailyReportForLeaderReview,
} from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/daily-report-persistence.ts');

describe('SCEN-434: リーダーが提出状態を\'all\'に指定して検索し、全ての日報が返される', () => {
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
  });

  it('提出状態\'all\'でフィルタリングされた場合、提出済み・未提出を問わず全ての日報が返される', async () => {
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
        userId: 'user-C',
        reportDate: '2024-01-15',
        content: 'Task 3',
        submittedAt: undefined,
      },
      {
        id: 'report-004',
        userId: 'user-A',
        reportDate: '2024-01-14',
        content: 'Task 4',
        submittedAt: '2024-01-14T18:20:00Z',
      },
    ];

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: testData,
      totalCount: 4,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue(expectedOutput);

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

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(4);

    result.dailyReports.forEach((report: DailyReportForLeaderReview) => {
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('userId');
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('content');
      expect(report).toHaveProperty('submittedAt');
    });

    expect(result.totalCount).toBe(4);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
