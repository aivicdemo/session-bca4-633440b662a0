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

describe('SCEN-570: リーダーメールアドレスがシステムで無効化されている場合、警告が記録される', () => {
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
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([
      {
        reportId: 'report-001',
        reporterName: 'テスト太郎',
        submissionDateTime: '2026-09-24T14:30:00Z',
        reportContent: 'テスト業務内容',
        reportDate: '2026-09-24',
      },
    ]);
    // @ts-ignore
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    // Setup retrieveEmailSendingHistoryByDateRange to return sending history with disabled email warning
    // @ts-ignore
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([
      {
        sentAt: '2026-09-24T10:00:00Z',
        type: 'submit_notification',
        to: 'leader@example.com',
        subject: '日報提出通知',
        deliveryStatus: 'failed',
        failureReason: 'このメールアドレスは無効化されています。配信できません。',
        isValid: false,
      },
    ]);

    // Setup validateAndDeliverLeaderNotification to return warning for disabled email
    // @ts-ignore
    mockValidateAndDeliverLeaderNotification.mockResolvedValue({
      isValid: false,
      deliveryStatus: 'failed',
      failureReason: 'このメールアドレスは無効化されています。配信できません。',
    });
  });

  it('メールアドレスがシステムで無効化されている場合、処理は正常に完了し、警告が記録されること', async () => {
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

  it('emailSendingHistory に無効化メッセージが含まれていること', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2026-09-24',
    };

    // @ts-ignore
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    const failureEntry = result.emailSendingHistory.find(
      (entry: any) => entry.failureReason && entry.failureReason.includes('無効化')
    );
    expect(failureEntry).toBeDefined();
    expect(failureEntry.failureReason).toBe('このメールアドレスは無効化されています。配信できません。');
    expect(failureEntry.deliveryStatus).toBe('failed');
    expect(failureEntry.isValid).toBe(false);
  });

  it('他のフィールド（submittedReports、nonSubmittedReporters、detectionLogs、submissionStatusSummary）も返されること', async () => {
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
});
