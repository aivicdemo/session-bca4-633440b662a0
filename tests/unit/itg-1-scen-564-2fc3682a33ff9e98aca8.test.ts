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

describe('SCEN-564: 提出済み日報の報告内容が空文字列またはnullの場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告内容が空文字列の場合、「日報内容が記録されていません。データを確認してください。」という例外がスローされる', async () => {
    const leaderId = 'leader-001';
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
          businessContent: '',
          submittedAt: '2024-01-15T16:45:00',
          achievements: '成果',
          challenges: '課題',
          tomorrowPlan: '明日',
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 100,
      retrievedAt: '2024-01-15T17:00:00',
    });

    retrieveNonSubmissionDetectionLogsByDateMock.mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T17:00:00',
    });

    retrieveEmailSendingHistoryByDateRangeMock.mockResolvedValue({
      success: true,
      emailSendingHistories: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 100,
    });

    const input = {
      leaderId,
      targetDate,
    };

    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(
      '日報内容が記録されていません。データを確認してください。'
    );
  });

  it('報告内容が null の場合、「日報内容が記録されていません。データを確認してください。」という例外がスローされる', async () => {
    const leaderId = 'leader-001';
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
          dailyReportId: 'RPT002',
          userId: 'reporter_B',
          reportDate: '2024-01-15',
          businessContent: null,
          submittedAt: '2024-01-15T16:45:00',
          achievements: '成果',
          challenges: '課題',
          tomorrowPlan: '明日',
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 100,
      retrievedAt: '2024-01-15T17:00:00',
    });

    retrieveNonSubmissionDetectionLogsByDateMock.mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T17:00:00',
    });

    retrieveEmailSendingHistoryByDateRangeMock.mockResolvedValue({
      success: true,
      emailSendingHistories: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 100,
    });

    const input = {
      leaderId,
      targetDate,
    };

    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(
      '日報内容が記録されていません。データを確認してください。'
    );
  });
});
