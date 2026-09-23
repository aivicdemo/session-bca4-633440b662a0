import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
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

describe('SCEN-567: リーダーメールアドレスの妥当性判定と配信を実行するとき、メールアドレスが登録され形式が正しく有効化されていれば配信が成功する', () => {
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

    // Setup successful stubs
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
    // @ts-ignore
    mockValidateAndDeliverLeaderNotification.mockResolvedValue({
      isValid: true,
      deliveryStatus: 'success',
      timestamp: new Date().toISOString(),
    });
  });

  it('メールアドレスが登録され形式が正しく有効化されていれば配信が成功する', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader@example.com',
      targetDate: '2025-01-15',
    };

    // @ts-ignore
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result).toBeDefined();
    expect(result.submittedReports).toBeDefined();
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.nonSubmittedReporters).toBeDefined();
    expect(result.detectionLogs).toBeDefined();
    expect(result.emailSendingHistory).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();

    // Verify validateAndDeliverLeaderNotification was called
    expect(mockValidateAndDeliverLeaderNotification).toHaveBeenCalled();
  });
});
