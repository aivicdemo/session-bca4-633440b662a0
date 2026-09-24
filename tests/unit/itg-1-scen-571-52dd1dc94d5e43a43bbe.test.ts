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

describe('SCEN-571: メール配信サービスが一時的に利用不可の場合、警告が記録される', () => {
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
      leaderEmail: 'leader@example.com',
      isAuthorized: true,
    });
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({ isBusinessDay: true, withinDeadline: true });
    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([]);
    // @ts-ignore
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    // Setup retrieveEmailSendingHistoryByDateRange to return sending history with temporary delay warning
    // @ts-ignore
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([
      {
        sentAt: '2026-09-24T10:00:00Z',
        type: 'submit_notification',
        to: 'leader@example.com',
        subject: '日報提出通知',
        deliveryStatus: 'failed',
        failureReason: 'メール配信に一時的な遅延が発生しています。後ほど再試行します。',
        isValid: true,
      },
    ]);

    // Setup validateAndDeliverLeaderNotification to return warning for temporary service unavailability
    // @ts-ignore
    mockValidateAndDeliverLeaderNotification.mockResolvedValue({
      isValid: true,
      deliveryStatus: 'failed',
      failureReason: 'メール配信に一時的な遅延が発生しています。後ほど再試行します。',
    });
  });

  it('メール配信サービスが一時的に利用不可の場合、処理は正常に完了すること', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2026-09-24',
    };

    // 関数呼び出しが正常に完了することを確認
    // @ts-ignore
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result).toBeDefined();
    expect(result.emailSendingHistory).toBeDefined();
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);
  });

  it('emailSendingHistory に一時的遅延メッセージが含まれていること', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2026-09-24',
    };

    // @ts-ignore
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    const warningEntry = result.emailSendingHistory.find(
      (entry: any) => entry.failureReason && entry.failureReason.includes('一時的な遅延')
    );
    expect(warningEntry).toBeDefined();
    expect(warningEntry.failureReason).toBe('メール配信に一時的な遅延が発生しています。後ほど再試行します。');
    expect(warningEntry.deliveryStatus).toBe('failed');
    expect(warningEntry.isValid).toBe(true);
  });

  it('管理画面表示用データは他のフィールドを含む完全な状態で生成されること', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2026-09-24',
    };

    // @ts-ignore
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.submittedReports).toBeDefined();
    expect(result.nonSubmittedReporters).toBeDefined();
    expect(result.detectionLogs).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();
  });

  it('DataRetrievalFailedError は発生しないこと', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2026-09-24',
    };

    // 関数呼び出しが正常に完了することを確認
    // @ts-ignore
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    // 結果が返されており、エラーが発生していないことを確認
    expect(result).toBeDefined();
  });
});
