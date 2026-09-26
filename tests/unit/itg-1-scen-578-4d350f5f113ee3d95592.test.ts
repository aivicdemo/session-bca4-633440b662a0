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

describe('SCEN-578: 本日の未提出者が0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('未提出者が0件のとき、nonSubmittedReportersフィールドが空配列である', async () => {
    const leaderId = 'valid-leader-id';
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
        {
          dailyReportId: 'R-002',
          userId: 'E-002',
          reportDate: '2024-01-15',
          businessContent: 'テスト日報2',
          submittedAt: '2024-01-15T11:00:00Z',
          achievements: undefined,
          challenges: undefined,
          tomorrowPlan: undefined,
        },
      ],
      totalCount: 2,
      pageNumber: 1,
      pageSize: 10,
      retrievedAt: '2024-01-15T20:00:00Z',
    });

    mockRetrieveDetectionLogs.mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T20:00:00Z',
    });

    mockRetrieveEmailHistory.mockResolvedValue({
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

    expect(result.nonSubmittedReporters).toEqual([]);
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(result.detectionLogs).toEqual([]);
    expect(result.submittedReports).toHaveLength(2);
    expect(result.emailSendingHistory).toHaveLength(2);
    expect(result.submissionStatusSummary).toHaveProperty('nonSubmittedCount', 0);
  });
});
