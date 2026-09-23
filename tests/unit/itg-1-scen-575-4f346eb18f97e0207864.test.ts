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

describe('SCEN-575: 提出済み日報が複数件存在するとき、すべての日報が統一フォーマットで配列に集約される', () => {
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
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([
      {
        reportId: 'report001',
        reporterName: '太郎',
        submissionDateTime: '2025-01-15T14:30:00Z',
        reportContent: '営業先A訪問、契約成立',
        reportDate: '2025-01-15',
      },
      {
        reportId: 'report002',
        reporterName: '花子',
        submissionDateTime: '2025-01-15T16:45:00Z',
        reportContent: '提案資料作成、次週プレゼン予定',
        reportDate: '2025-01-15',
      },
      {
        reportId: 'report003',
        reporterName: '次郎',
        submissionDateTime: '2025-01-15T17:30:00Z',
        reportContent: '定例会議参加、予算承認取得',
        reportDate: '2025-01-15',
      },
    ]);
    // @ts-ignore
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    // @ts-ignore
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
    // @ts-ignore
    mockValidateAndDeliverLeaderNotification.mockResolvedValue({
      isValid: true,
      deliveryStatus: 'success',
    });
  });

  it('複数件の日報がすべて統一フォーマットで集約される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2025-01-15',
    };

    // @ts-ignore
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result).toBeDefined();
    expect(result.submittedReports).toBeDefined();
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.submittedReports.length).toBe(3);

    // Verify first report
    const report1 = result.submittedReports[0];
    expect(report1.displayReporterName).toBe('太郎');
    expect(report1.displaySubmissionTime).toBe('14:30');
    expect(report1.displayContent).toBe('営業先A訪問、契約成立');
    expect(report1.isLate).toBe(false);
    expect(report1.displayDate).toContain('2025年01月15日');

    // Verify second report
    const report2 = result.submittedReports[1];
    expect(report2.displayReporterName).toBe('花子');
    expect(report2.displaySubmissionTime).toBe('16:45');
    expect(report2.displayContent).toBe('提案資料作成、次週プレゼン予定');
    expect(report2.isLate).toBe(false);

    // Verify third report
    const report3 = result.submittedReports[2];
    expect(report3.displayReporterName).toBe('次郎');
    expect(report3.displaySubmissionTime).toBe('17:30');
    expect(report3.displayContent).toBe('定例会議参加、予算承認取得');
    expect(report3.isLate).toBe(true);

    // Verify other fields
    expect(result.nonSubmittedReporters).toBeDefined();
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(result.nonSubmittedReporters.length).toBe(0);

    expect(result.detectionLogs).toBeDefined();
    expect(Array.isArray(result.detectionLogs)).toBe(true);

    expect(result.emailSendingHistory).toBeDefined();
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);

    expect(result.submissionStatusSummary).toBeDefined();
  });
});
