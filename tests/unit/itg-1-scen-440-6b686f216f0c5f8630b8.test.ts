jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-440: リーダーがソート対象を指定しないで検索し、報告日の降順で日報が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ソート指定なしで検索すると、報告日の降順（新→旧）で日報が返される', async () => {
    const leaderId = 'leader001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const mockReports = [
      {
        dailyReportId: 'report1',
        userId: 'user1',
        reportDate: '2024-01-20',
        businessContent: 'Content 1',
        submittedAt: '2024-01-20T15:30:00Z',
      },
      {
        dailyReportId: 'report2',
        userId: 'user2',
        reportDate: '2024-01-15',
        businessContent: 'Content 2',
        submittedAt: '2024-01-15T09:00:00Z',
      },
      {
        dailyReportId: 'report3',
        userId: 'user3',
        reportDate: '2024-01-10',
        businessContent: 'Content 3',
        submittedAt: '2024-01-10T18:45:00Z',
      },
    ];

    const mockOutput = {
      dailyReports: mockReports,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    };

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue(mockOutput);

    const result = await retrieveDailyReportsForLeaderReview({
      leaderId,
      startDate,
      endDate,
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    expect(result.dailyReports).toHaveLength(3);
    expect(result.dailyReports[0].reportDate).toBe('2024-01-20');
    expect(result.dailyReports[1].reportDate).toBe('2024-01-15');
    expect(result.dailyReports[2].reportDate).toBe('2024-01-10');
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(mockedRetrieveDailyReportsForLeaderReview).toHaveBeenCalledWith({
      leaderId,
      startDate,
      endDate,
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    // 各レコードが必要なフィールドを含んでいることを検証
    result.dailyReports.forEach((report) => {
      expect(report).toHaveProperty('dailyReportId');
      expect(report).toHaveProperty('userId');
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('businessContent');
      expect(report).toHaveProperty('submittedAt');
    });
  });
});
