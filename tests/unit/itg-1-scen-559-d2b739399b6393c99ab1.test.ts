import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';

const authenticateAndAuthorizeLeaderAccessMock = jest.fn();
const judgeBusinessDayAndDeadlineMock = jest.fn();
const retrieveDailyReportsForLeaderReviewMock = jest.fn();
const retrieveNonSubmissionDetectionLogsByDateMock = jest.fn();
const retrieveEmailSendingHistoryByDateRangeMock = jest.fn();

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: authenticateAndAuthorizeLeaderAccessMock,
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: judgeBusinessDayAndDeadlineMock,
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: retrieveDailyReportsForLeaderReviewMock,
  retrieveNonSubmissionDetectionLogsByDate: retrieveNonSubmissionDetectionLogsByDateMock,
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  retrieveEmailSendingHistoryByDateRange: retrieveEmailSendingHistoryByDateRangeMock,
}));

describe('SCEN-559: リーダーが有効な認証情報で管理画面にアクセスしたとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('本日の提出済み日報一覧、未提出者一覧、検知ログ、メール送信履歴を集約したダッシュボードデータが返される', async () => {
    const leaderId = 'leader001';
    const targetDate = '2024-01-15';

    authenticateAndAuthorizeLeaderAccessMock.mockResolvedValue({
      isAccessGranted: true,
      userId: leaderId,
    });

    judgeBusinessDayAndDeadlineMock.mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
    });

    retrieveDailyReportsForLeaderReviewMock.mockResolvedValue({
      dailyReports: [
        {
          dailyReportId: 'RPT001',
          userId: 'reporter_A',
          reportDate: '2024-01-15',
          businessContent: 'テスト業務A',
          submittedAt: '2024-01-15T16:45:00',
          achievements: '成果A',
          challenges: '課題A',
          tomorrowPlan: '明日の予定A',
        },
        {
          dailyReportId: 'RPT002',
          userId: 'reporter_B',
          reportDate: '2024-01-15',
          businessContent: 'テスト業務B',
          submittedAt: '2024-01-15T15:30:00',
          achievements: '成果B',
          challenges: '課題B',
          tomorrowPlan: '明日の予定B',
        },
      ],
      totalCount: 2,
      pageNumber: 1,
      pageSize: 100,
      retrievedAt: '2024-01-15T17:00:00',
    });

    retrieveNonSubmissionDetectionLogsByDateMock.mockResolvedValue({
      detectionLogs: [
        {
          detectionLogId: 'LOG_C',
          userId: 'reporter_C',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T17:00:00',
          reminderSent: false,
          reminderSentDateTime: null,
          submissionStatus: 'not_submitted',
        },
        {
          detectionLogId: 'LOG_D',
          userId: 'reporter_D',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T17:00:00',
          reminderSent: false,
          reminderSentDateTime: null,
          submissionStatus: 'not_submitted',
        },
        {
          detectionLogId: 'LOG_E',
          userId: 'reporter_E',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T17:00:00',
          reminderSent: false,
          reminderSentDateTime: null,
          submissionStatus: 'not_submitted',
        },
      ],
      totalCount: 3,
      retrievedAt: '2024-01-15T17:00:00',
    });

    retrieveEmailSendingHistoryByDateRangeMock.mockResolvedValue({
      success: true,
      emailSendingHistories: [
        {
          emailSendingHistoryId: 'MAIL001',
          userId: leaderId,
          emailType: 'daily_report_submission',
          recipientEmailAddress: 'reporter_a@example.com',
          subject: '日報提出通知',
          body: '日報が提出されました',
          sentDateTime: new Date('2024-01-15T16:45:00'),
          sendingStatus: 'success',
          errorMessage: null,
          relatedDailyReportId: 'RPT001',
          relatedReminderSettingId: null,
          resendFlag: false,
          createdAt: new Date('2024-01-15T16:45:00'),
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 100,
    });

    const input = {
      leaderId,
      targetDate,
    };

    const result = await retrieveLeaderDashboardData(input);

    expect(result).toBeDefined();
    expect(result.submittedReports).toBeDefined();
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.submittedReports.length).toBe(2);

    expect(result.nonSubmittedReporters).toBeDefined();
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(result.nonSubmittedReporters.length).toBe(3);

    expect(result.detectionLogs).toBeDefined();
    expect(Array.isArray(result.detectionLogs)).toBe(true);

    expect(result.emailSendingHistory).toBeDefined();
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);

    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.submissionStatusSummary.totalReporters).toBeGreaterThanOrEqual(2);
    expect(result.submissionStatusSummary.submittedCount).toBe(2);
    expect(result.submissionStatusSummary.nonSubmittedCount).toBe(3);
  });
});
