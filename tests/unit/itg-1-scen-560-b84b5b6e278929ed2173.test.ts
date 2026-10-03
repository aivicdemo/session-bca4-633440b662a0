import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { retrieveLeaderDashboardData, LeaderAuthorizationFailedError } from '../../src/logic/daily-report-management-view';

const authenticateAndAuthorizeLeaderAccessMock = jest.fn();

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: authenticateAndAuthorizeLeaderAccessMock,
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

describe('SCEN-560: リーダーの認証・認可に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('LeaderAuthorizationFailedError が throw され、エラーメッセージが「リーダーとしてのアクセス権限がありません。」である', async () => {
    const leaderId = 'leader_invalid_id';
    const targetDate = '2024-01-15';

    authenticateAndAuthorizeLeaderAccessMock.mockResolvedValue({
      isAccessGranted: false,
      userId: leaderId,
      denialReason: 'リーダー権限なし',
    });

    const input = {
      leaderId,
      targetDate,
    };

    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(LeaderAuthorizationFailedError);
    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow('リーダーとしてのアクセス権限がありません。');
  });
});
