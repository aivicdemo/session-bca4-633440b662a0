import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { retrieveLeaderDashboardData, TargetDateInvalidError } from '../../src/logic/daily-report-management-view';

const authenticateAndAuthorizeLeaderAccessMock = jest.fn();
const judgeBusinessDayAndDeadlineMock = jest.fn();

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: authenticateAndAuthorizeLeaderAccessMock,
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: judgeBusinessDayAndDeadlineMock,
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

describe('SCEN-561: 指定された対象日付が営業日判定に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TargetDateInvalidError が発生し、エラー文言として「指定された日付は無効です。」が返される', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-02-30';

    authenticateAndAuthorizeLeaderAccessMock.mockResolvedValue({
      isAccessGranted: true,
      userId: leaderId,
    });

    judgeBusinessDayAndDeadlineMock.mockResolvedValue({
      isAcceptable: false,
      isBusinessDay: false,
      isWithinDeadline: false,
    });

    const input = {
      leaderId,
      targetDate,
    };

    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(TargetDateInvalidError);
    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow('指定された日付は無効です。');
  });
});
