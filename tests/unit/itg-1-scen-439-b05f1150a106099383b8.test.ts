jest.mock('../../src/logic/daily-report-persistence');

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type { RetrieveDailyReportsForLeaderReviewInput, RetrieveDailyReportsForLeaderReviewOutput } from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-439: リーダーがページネーションを指定しないで検索し、デフォルトの50件単位で日報が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return reports with default pagination of 50 items per page', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const generatedReports = Array.from({ length: 50 }, (_, i) => ({
      id: `report-${i + 1}`,
      userId: `user-${(i % 10) + 1}`,
      reportDate: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
      businessContent: `Content ${i + 1}`,
      submittedAt: `2024-01-${String((i % 30) + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:00:00Z`,
    }));

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: generatedReports,
      totalCount: 50,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue(expectedOutput);

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(50);
    expect(result.totalCount).toBe(50);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
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
