import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { retrieveDailyReportsForLeaderReview, retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.MockedFunction<any>;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<any>;
const mockedRetrieveEmailSendingHistoryByDateRange = retrieveEmailSendingHistoryByDateRange as jest.MockedFunction<any>;

describe('SCEN-582: 本日のメール送信履歴が0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAccessGranted: true,
      leaderId: 'leader001',
      denialReason: null,
    });

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      isWithinDeadline: true,
      deadlineTime: '18:00',
    });

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      success: true,
      reports: [
        {
          reportId: 'R001',
          reporterId: 'REP-001',
          reporterName: '太郎',
          submissionTime: '2024-01-15T17:30:00Z',
          businessContent: '顧客対応',
          achievements: '2件の受注取得',
          issues: 'なし',
          tomorrowPlan: '提案資料作成',
        },
      ],
      totalCount: 1,
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      success: true,
      detectionLogs: [
        {
          detectionLogId: 'DL-001',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T18:00:00Z',
          nonSubmittedReporters: [
            { userId: 'U002', name: '花子', team: '営業部' },
          ],
          reminderSent: false,
        },
      ],
      totalCount: 1,
    });

    mockedRetrieveEmailSendingHistoryByDateRange.mockResolvedValue({
      success: true,
      emailHistory: [],
      totalCount: 0,
    });
  });

  it('emailSendingHistory が空の配列を返す', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    });

    expect(result.emailSendingHistory).toEqual([]);
    expect(result.emailSendingHistory.length).toBe(0);
  });

  it('他のフィールドは各スタブの戻り値に従う', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    });

    expect(result.submittedReports).toBeDefined();
    expect(result.nonSubmittedReporters).toBeDefined();
    expect(result.detectionLogs).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();
  });

  it('エラーは発生しない', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    });

    expect(result).toBeDefined();
  });
});
