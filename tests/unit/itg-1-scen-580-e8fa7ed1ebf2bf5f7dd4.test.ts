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

import {
  retrieveLeaderDashboardData,
  type RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import {
  retrieveDailyReportsForLeaderReview,
  retrieveNonSubmissionDetectionLogsByDate,
} from '../../src/logic/daily-report-persistence';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

describe('SCEN-580: 本日の検知ログが0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検知ログが0件のとき、detectionLogsフィールドが空配列である', async () => {
    const leaderId = 'leader001';
    const targetDate = '2024-01-15';

    (authenticateAndAuthorizeLeaderAccess as jest.Mock).mockResolvedValue({
      isAccessGranted: true,
      userId: leaderId,
      denialReason: null,
    });

    (judgeBusinessDayAndDeadline as jest.Mock).mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T18:00:00Z',
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    (retrieveDailyReportsForLeaderReview as jest.Mock).mockResolvedValue({
      dailyReports: [
        {
          dailyReportId: 'R-001',
          userId: 'E-001',
          reportDate: '2024-01-15',
          businessContent: 'テスト日報',
          submittedAt: '2024-01-15T10:30:00Z',
          achievements: undefined,
          challenges: undefined,
          tomorrowPlan: undefined,
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      retrievedAt: '2024-01-15T20:00:00Z',
    });

    (retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T20:00:00Z',
    });

    (retrieveEmailSendingHistoryByDateRange as jest.Mock).mockResolvedValue({
      success: true,
      emailSendingHistories: [
        {
          emailSendingHistoryId: 'mail-001',
          userId: 'user-001',
          emailType: 'daily_report_submission' as const,
          recipientEmailAddress: 'user@example.com',
          subject: 'Daily report submitted',
          body: 'Your daily report has been submitted',
          sentDateTime: new Date('2024-01-15T11:00:00Z'),
          sendingStatus: 'success' as const,
          errorMessage: null,
          relatedDailyReportId: null,
          relatedReminderSettingId: null,
          resendFlag: false,
          createdAt: new Date('2024-01-15T11:00:00Z'),
        },
        {
          emailSendingHistoryId: 'mail-002',
          userId: 'leader-001',
          emailType: 'reminder_notification' as const,
          recipientEmailAddress: 'leader@example.com',
          subject: 'Unsubmitted list',
          body: 'End of day unsubmitted list',
          sentDateTime: new Date('2024-01-15T18:30:00Z'),
          sendingStatus: 'success' as const,
          errorMessage: null,
          relatedDailyReportId: null,
          relatedReminderSettingId: null,
          resendFlag: false,
          createdAt: new Date('2024-01-15T18:30:00Z'),
        },
      ],
      totalCount: 2,
      pageNumber: 1,
      pageSize: 10,
      message: '',
    });

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    expect(result.detectionLogs).toEqual([]);
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(result.submittedReports).toHaveLength(1);
    expect(result.emailSendingHistory).toHaveLength(2);
    expect(result.submissionStatusSummary).toBeDefined();
  });
});
