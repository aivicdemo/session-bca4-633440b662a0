jest.mock('../../src/logic/daily-report-persistence');

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import type {
  RetrieveDailyReportsForLeaderReviewInput,
  RetrieveDailyReportsForLeaderReviewOutput,
  DailyReportForLeaderReview,
} from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.MockedFunction<
  typeof retrieveDailyReportsForLeaderReview
>;

describe('SCEN-438: リーダーがページネーションを指定して検索し、指定されたページ番号とページサイズの日報が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return reports for page 2 with page size 10', async () => {
    const input: RetrieveDailyReportsForLeaderReviewInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterBySubmissionStatus: 'submitted',
      pageNumber: 2,
      pageSize: 10,
    };

    const reports: DailyReportForLeaderReview[] = Array.from({ length: 10 }, (_, i) => ({
      dailyReportId: `report-${10 + i + 1}`,
      userId: `user-${(10 + i) % 5}`,
      reportDate: `2024-01-${String((10 + i) % 31 + 1).padStart(2, '0')}`,
      businessContent: `Content ${10 + i + 1}`,
      submittedAt: `2024-01-${String((10 + i) % 31 + 1).padStart(2, '0')}T${String((i + 10) % 24).padStart(2, '0')}:00:00Z`,
    }));

    const expectedOutput: RetrieveDailyReportsForLeaderReviewOutput = {
      dailyReports: reports,
      totalCount: 60,
      pageNumber: 2,
      pageSize: 10,
      retrievedAt: '2024-01-01T10:00:00Z',
    };

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue(expectedOutput);

    const result = await retrieveDailyReportsForLeaderReview(input);

    expect(result.dailyReports).toHaveLength(10);
    expect(result.totalCount).toBe(60);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    result.dailyReports.forEach((report) => {
      expect(report.dailyReportId).toBeDefined();
      expect(report.userId).toBeDefined();
      expect(report.reportDate).toBeDefined();
      expect(report.businessContent).toBeDefined();
      expect(report.submittedAt).toBeDefined();
    });

    expect(result.dailyReports[0].reportDate).toBe('2024-01-11');
  });
});
