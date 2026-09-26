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

describe('SCEN-581: 本日のメール送信履歴が複数件存在するとき、すべての送信履歴が配列に集約される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数のメール送信履歴がすべて配列に集約される', async () => {
    const leaderId = 'leader-001';
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
          sentDateTime: new Date('2024-01-15T09:30:00Z'),
          sendingStatus: 'success' as const,
          errorMessage: null,
          relatedDailyReportId: null,
          relatedReminderSettingId: null,
          resendFlag: false,
          createdAt: new Date('2024-01-15T09:30:00Z'),
        },
        {
          emailSendingHistoryId: 'mail-002',
          userId: 'leader-001',
          emailType: 'reminder_notification' as const,
          recipientEmailAddress: 'leader@example.com',
          subject: 'End of day unsubmitted list',
          body: 'End of day unsubmitted list',
          sentDateTime: new Date('2024-01-15T18:00:00Z'),
          sendingStatus: 'success' as const,
          errorMessage: null,
          relatedDailyReportId: null,
          relatedReminderSettingId: null,
          resendFlag: false,
          createdAt: new Date('2024-01-15T18:00:00Z'),
        },
        {
          emailSendingHistoryId: 'mail-003',
          userId: 'user-002',
          emailType: 'daily_report_submission' as const,
          recipientEmailAddress: 'user2@example.com',
          subject: 'Daily report submitted',
          body: 'Your daily report has been submitted',
          sentDateTime: new Date('2024-01-15T18:30:00Z'),
          sendingStatus: 'success' as const,
          errorMessage: null,
          relatedDailyReportId: null,
          relatedReminderSettingId: null,
          resendFlag: false,
          createdAt: new Date('2024-01-15T18:30:00Z'),
        },
      ],
      totalCount: 3,
      pageNumber: 1,
      pageSize: 10,
      message: '',
    });

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    expect(result.emailSendingHistory.length).toBe(3);
    expect(result.emailSendingHistory[0].emailType).toBe('daily_report_submission');
    expect(result.emailSendingHistory[0].sendingStatus).toBe('success');
    expect(result.emailSendingHistory[1].emailType).toBe('reminder_notification');
    expect(result.emailSendingHistory[1].sendingStatus).toBe('success');
    expect(result.emailSendingHistory[2].emailType).toBe('daily_report_submission');
    expect(result.emailSendingHistory[2].sendingStatus).toBe('success');
  });
});
