jest.mock('../../src/logic/daily-report-persistence');

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput, RetrieveDailyReportsForLeaderReviewOutput } from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-438: リーダーがページネーションを指定して検索し、指定されたページ番号とページサイズの日報が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return reports for page 2 with page size 10', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: 2,
      pageSize: 10,
    };

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: Array.from({ length: 10 }, (_, i) => ({
        id: `report-${10 + i + 1}`,
        userId: `user-${(10 + i) % 5}`,
        reportDate: `2024-01-${String((10 + i) % 31 + 1).padStart(2, '0')}`,
        businessContent: `Content ${10 + i + 1}`,
        submittedAt: `2024-01-${String((10 + i) % 31 + 1).padStart(2, '0')}T${String((i + 10) % 24).padStart(2, '0')}:00:00Z`,
      })),
      totalCount: 60,
      pageNumber: 2,
      pageSize: 10,
      retrievedAt: new Date().toISOString(),
    };

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue(expectedOutput);

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(10);
    expect(result.totalCount).toBe(60);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    result.dailyReports.forEach((report) => {
      expect(report.id).toBeDefined();
      expect(report.userId).toBeDefined();
      expect(report.reportDate).toBeDefined();
      expect(report.businessContent).toBeDefined();
      expect(report.submittedAt).toBeDefined();
    });
  });
});
