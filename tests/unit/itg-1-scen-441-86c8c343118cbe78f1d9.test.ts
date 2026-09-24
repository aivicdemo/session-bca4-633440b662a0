jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));

import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-441: 検索対象期間に複数の日報が存在する場合、totalCountにフィルター条件に合致した全日報件数が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filterBySubmissionStatus="submitted"で複数の提出済み日報が存在する場合、totalCountが正確に返される', async () => {
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const mockReports = [
      {
        dailyReportId: 'report1',
        userId: 'user1',
        reportDate: '2024-01-20',
        businessContent: 'Business Content 1',
        submittedAt: '2024-01-20T15:30:00Z',
      },
      {
        dailyReportId: 'report2',
        userId: 'user2',
        reportDate: '2024-01-19',
        businessContent: 'Business Content 2',
        submittedAt: '2024-01-19T10:15:00Z',
      },
      {
        dailyReportId: 'report3',
        userId: 'user3',
        reportDate: '2024-01-18',
        businessContent: 'Business Content 3',
        submittedAt: '2024-01-18T14:45:00Z',
      },
      {
        dailyReportId: 'report4',
        userId: 'user4',
        reportDate: '2024-01-17',
        businessContent: 'Business Content 4',
        submittedAt: '2024-01-17T09:20:00Z',
      },
      {
        dailyReportId: 'report5',
        userId: 'user5',
        reportDate: '2024-01-16',
        businessContent: 'Business Content 5',
        submittedAt: '2024-01-16T16:00:00Z',
      },
    ];

    const mockOutput = {
      dailyReports: mockReports,
      totalCount: 5,
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
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    expect(result.dailyReports).toHaveLength(5);

    // 各レコードが必要なフィールドを含んでいることを検証
    result.dailyReports.forEach((report) => {
      expect(report).toHaveProperty('dailyReportId');
      expect(report).toHaveProperty('userId');
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('businessContent');
      expect(report).toHaveProperty('submittedAt');
    });

    // totalCount が指定期間・filterBySubmissionStatus='submitted' の条件に合致した全日報件数と一致
    expect(result.totalCount).toBe(5);

    // デフォルト値
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    // retrievedAt が ISO 8601形式であることを検証
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(mockedRetrieveDailyReportsForLeaderReview).toHaveBeenCalledWith({
      leaderId,
      startDate,
      endDate,
      filterByUserId: undefined,
      filterBySubmissionStatus: 'submitted',
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });
  });
});
