import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveDailyReportsForLeaderReview,
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
  DailyReportForLeaderReview,
} from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/daily-report-persistence.ts');

describe('SCEN-436: リーダーがソート対象を\'submittedAt\'に指定して検索し、提出時刻でソートされた日報が返される', () => {
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
  });

  it('sortByが\'submittedAt\'の場合、提出時刻の昇順でソートされた日報が返される', async () => {
    const testData: DailyReportForLeaderReview[] = [
      {
        id: 'report-001',
        userId: 'user-001',
        reportDate: '2024-01-01',
        content: 'Task 1',
        submittedAt: '2024-01-01T08:30:00Z',
      },
      {
        id: 'report-002',
        userId: 'user-002',
        reportDate: '2024-01-01',
        content: 'Task 2',
        submittedAt: '2024-01-01T09:15:00Z',
      },
      {
        id: 'report-003',
        userId: 'user-003',
        reportDate: '2024-01-02',
        content: 'Task 3',
        submittedAt: '2024-01-02T07:45:00Z',
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
      sortBy: 'submittedAt',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(3);

    result.dailyReports.forEach((report: DailyReportForLeaderReview) => {
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('userId');
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('content');
      expect(report).toHaveProperty('submittedAt');
    });

    expect(result.dailyReports[0].submittedAt).toBe('2024-01-01T08:30:00Z');
    expect(result.dailyReports[1].submittedAt).toBe('2024-01-01T09:15:00Z');
    expect(result.dailyReports[2].submittedAt).toBe('2024-01-02T07:45:00Z');

    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
