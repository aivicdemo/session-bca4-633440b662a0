import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
  DataRetrievalFailedError,
} from '../../src/logic/daily-report-management-view';

jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-persistence.ts', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

jest.mock('../../src/logic/notification-delivery.ts', () => ({
  validateAndDeliverLeaderNotification: jest.fn(),
}));

describe('SCEN-573: validateAndDeliverLeaderNotification処理で例外が発生した場合、その旨が適切に伝達される', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockJudgeBusinessDayAndDeadline: jest.Mock;
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;
  let mockRetrieveNonSubmissionDetectionLogsByDate: jest.Mock;
  let mockRetrieveEmailSendingHistoryByDateRange: jest.Mock;
  let mockValidateAndDeliverLeaderNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticateAndAuthorizeLeaderAccess = require('../../src/logic/user-authentication-authorization.ts')
      .authenticateAndAuthorizeLeaderAccess as jest.Mock;
    mockJudgeBusinessDayAndDeadline = require('../../src/logic/business-day-deadline-judgment.ts')
      .judgeBusinessDayAndDeadline as jest.Mock;
    mockRetrieveDailyReportsForLeaderReview = require('../../src/logic/daily-report-persistence.ts')
      .retrieveDailyReportsForLeaderReview as jest.Mock;
    mockRetrieveNonSubmissionDetectionLogsByDate = require('../../src/logic/daily-report-persistence.ts')
      .retrieveNonSubmissionDetectionLogsByDate as jest.Mock;
    mockRetrieveEmailSendingHistoryByDateRange = require('../../src/logic/user-master-persistence.ts')
      .retrieveEmailSendingHistoryByDateRange as jest.Mock;
    mockValidateAndDeliverLeaderNotification = require('../../src/logic/notification-delivery.ts')
      .validateAndDeliverLeaderNotification as jest.Mock;

    // Setup successful stubs for other operations
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ isAuthorized: true });
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({ isBusinessDay: true, withinDeadline: true });
    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([]);
    // @ts-ignore
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    // @ts-ignore
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);

    // Setup validateAndDeliverLeaderNotification to throw an error
    (mockValidateAndDeliverLeaderNotification as any).mockRejectedValue(
      new Error('メール配信サービスが一時的に利用不可のため、配信に失敗しました')
    );
  });

  it('validateAndDeliverLeaderNotification処理で例外が発生した場合、例外が適切に伝達される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    try {
      // @ts-ignore
      await retrieveLeaderDashboardData(input);
      fail('Should have thrown an error');
    } catch (error: any) {
      // Either DataRetrievalFailedError or the error is wrapped/logged appropriately
      expect(error).toBeDefined();
      // The error message should indicate a problem with notification delivery
      expect(error.message).toContain('配信');
    }
  });
});
