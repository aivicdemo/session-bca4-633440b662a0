import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
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

describe('SCEN-569: リーダーメールアドレスの形式が不正である場合、例外がスローされる', () => {
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

    // Setup successful stubs for authentication and business day judgment
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      leaderId: 'leader-001',
      leaderEmail: 'leader@domain', // Invalid email format (no dot in domain)
      isAuthorized: true,
    });
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({ isBusinessDay: true, withinDeadline: true });
    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([]);
    // @ts-ignore
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    // @ts-ignore
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);

    // Setup validateAndDeliverLeaderNotification to throw error for invalid email format
    // @ts-ignore
    mockValidateAndDeliverLeaderNotification.mockImplementation(() => {
      const error = new Error('メールアドレスの形式が無効です。正しいアドレスを入力してください。');
      throw error;
    });
  });

  it('メールアドレスがleader@domain（ドメイン部分に「.」を含まない）の形式の場合、例外がスローされること', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2026-09-24',
    };

    // 呼び出しが例外をスローすることを確認
    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(
      'メールアドレスの形式が無効です。正しいアドレスを入力してください。'
    );
  });

  it('メールアドレス形式検証エラーの場合、RetrieveLeaderDashboardDataOutputが返されないこと', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2026-09-24',
    };

    const result = retrieveLeaderDashboardData(input);

    // 例外がスローされることを検証
    await expect(result).rejects.toThrow();
  });

  it('validateAndDeliverLeaderNotificationが内部で実行され、メールアドレス検証に到達すること', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2026-09-24',
    };

    try {
      await retrieveLeaderDashboardData(input);
    } catch {
      // Expected error
    }

    // validateAndDeliverLeaderNotification が呼ばれたことを確認
    expect(mockValidateAndDeliverLeaderNotification).toHaveBeenCalled();
  });
});
