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

describe('SCEN-577: 本日の未提出者が複数件存在するとき、すべての未提出者情報が配列に集約される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の未提出者情報がすべて配列に集約される', async () => {
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

    mockRetrieveDetectionLogs.mockResolvedValue({
      detectionLogs: [
        {
          detectionLogId: 'DL-001',
          userId: 'E-002',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T18:05:00Z',
          reminderSent: false,
          reminderSentDateTime: null,
          submissionStatus: 'not_submitted' as const,
        },
        {
          detectionLogId: 'DL-002',
          userId: 'E-003',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T18:05:00Z',
          reminderSent: false,
          reminderSentDateTime: null,
          submissionStatus: 'not_submitted' as const,
        },
        {
          detectionLogId: 'DL-003',
          userId: 'E-004',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T18:05:00Z',
          reminderSent: false,
          reminderSentDateTime: null,
          submissionStatus: 'not_submitted' as const,
        },
      ],
      totalCount: 3,
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

    expect(result.nonSubmittedReporters.length).toBe(3);
    expect(result.submittedReports.length).toBe(1);
    expect(result.submissionStatusSummary).toHaveProperty('submittedCount', 1);
    expect(result.submissionStatusSummary).toHaveProperty('nonSubmittedCount', 3);
  });
});
