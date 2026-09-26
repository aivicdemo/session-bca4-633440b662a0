import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

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

describe('SCEN-576: 本日の提出済み日報が0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('本日の提出済み日報が0件のとき、submittedReportsフィールドが空配列である', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    const mockAuth = authenticateAndAuthorizeLeaderAccess as any;
    const mockJudge = judgeBusinessDayAndDeadline as any;
    const mockRetrieveReports = retrieveDailyReportsForLeaderReview as any;
    const mockRetrieveDetectionLogs = retrieveNonSubmissionDetectionLogsByDate as any;
    const mockRetrieveEmailHistory = retrieveEmailSendingHistoryByDateRange as any;

    mockAuth.mockResolvedValue({
      isAccessGranted: true,
      userId: leaderId,
      denialReason: null,
    });

    mockJudge.mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T18:00:00Z',
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    mockRetrieveReports.mockResolvedValue({
      dailyReports: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
      retrievedAt: '2024-01-15T20:00:00Z',
    });

    mockRetrieveDetectionLogs.mockResolvedValue({
      detectionLogs: [
        {
          detectionLogId: 'DL-001',
          userId: 'user-001',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T18:05:00Z',
          reminderSent: false,
          reminderSentDateTime: null,
          submissionStatus: 'not_submitted' as const,
        },
      ],
      totalCount: 1,
      retrievedAt: '2024-01-15T20:00:00Z',
    });

    mockRetrieveEmailHistory.mockResolvedValue({
      success: true,
      emailSendingHistories: [
        {
          emailSendingHistoryId: 'mail-001',
          userId: 'user-001',
          emailType: 'reminder_notification' as const,
          recipientEmailAddress: 'user@example.com',
          subject: 'Daily report reminder',
          body: 'Please submit your daily report',
          sentDateTime: new Date('2024-01-15T09:00:00Z'),
          sendingStatus: 'success' as const,
          errorMessage: null,
          relatedDailyReportId: null,
          relatedReminderSettingId: null,
          resendFlag: false,
          createdAt: new Date('2024-01-15T09:00:00Z'),
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      message: '',
    });

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    expect(result.submittedReports).toEqual([]);
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.submittedReports.length).toBe(0);
    expect(result).toHaveProperty('nonSubmittedReporters');
    expect(result).toHaveProperty('detectionLogs');
    expect(result).toHaveProperty('emailSendingHistory');
    expect(result).toHaveProperty('submissionStatusSummary');
  });
});
