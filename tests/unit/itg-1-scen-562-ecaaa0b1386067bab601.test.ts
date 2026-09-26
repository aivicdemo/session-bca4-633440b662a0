import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { retrieveLeaderDashboardData, DataRetrievalFailedError } from '../../src/logic/daily-report-management-view';

const authenticateAndAuthorizeLeaderAccessMock = jest.fn();
const judgeBusinessDayAndDeadlineMock = jest.fn();
const retrieveDailyReportsForLeaderReviewMock = jest.fn();

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: authenticateAndAuthorizeLeaderAccessMock,
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: judgeBusinessDayAndDeadlineMock,
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: retrieveDailyReportsForLeaderReviewMock,
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

describe('SCEN-562: 日報、検知ログ、メール送信履歴の取得に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DataRetrievalFailedError が発生し、エラーメッセージが「管理画面データの取得に失敗しました。」である', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2025-01-15';

    authenticateAndAuthorizeLeaderAccessMock.mockResolvedValue({
      isAccessGranted: true,
      userId: leaderId,
    });

    judgeBusinessDayAndDeadlineMock.mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
    });

    retrieveDailyReportsForLeaderReviewMock.mockRejectedValue(
      new DataRetrievalFailedError('管理画面データの取得に失敗しました。')
    );

    const input = {
      leaderId,
      targetDate,
    };

    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(DataRetrievalFailedError);
    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow('管理画面データの取得に失敗しました。');
  });
});
