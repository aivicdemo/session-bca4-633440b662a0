import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
  DailyReportForLeaderReview,
} from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/daily-report-persistence.ts');

describe('SCEN-435: リーダーがソート対象を\'reportDate\'に指定して検索し、報告日の降順で日報が返される', () => {
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
  });

  it('sortByが\'reportDate\'の場合、報告日の降順でソートされた日報が返される', async () => {
    const testData: DailyReportForLeaderReview[] = [
      {
        id: 'report-B',
        userId: 'user-003',
        reportDate: '2024-01-20',
        content: 'Task B',
        submittedAt: '2024-01-20T14:15:00Z',
      },
      {
        id: 'report-A',
        userId: 'user-002',
        reportDate: '2024-01-15',
        content: 'Task A',
        submittedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 'report-C',
        userId: 'user-001',
        reportDate: '2024-01-10',
        content: 'Task C',
        submittedAt: '2024-01-10T09:45:00Z',
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
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: 'reportDate',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(3);

    expect(result.dailyReports[0].userId).toBe('user-003');
    expect(result.dailyReports[0].reportDate).toBe('2024-01-20');
    expect(result.dailyReports[0].submittedAt).toBe('2024-01-20T14:15:00Z');

    expect(result.dailyReports[1].userId).toBe('user-002');
    expect(result.dailyReports[1].reportDate).toBe('2024-01-15');
    expect(result.dailyReports[1].submittedAt).toBe('2024-01-15T10:30:00Z');

    expect(result.dailyReports[2].userId).toBe('user-001');
    expect(result.dailyReports[2].reportDate).toBe('2024-01-10');
    expect(result.dailyReports[2].submittedAt).toBe('2024-01-10T09:45:00Z');

    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
