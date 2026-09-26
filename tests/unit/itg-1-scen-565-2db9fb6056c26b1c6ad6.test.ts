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

describe('SCEN-565: 提出済み日報の提出日時が不正な値の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('提出日時が null の場合、「提出時刻の記録が不正です。システム管理者に連絡してください。」という例外がスローされる', async () => {
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
          businessContent: '本日の業務内容',
          submittedAt: null,
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
      '提出時刻の記録が不正です。システム管理者に連絡してください。'
    );
  });

  it('提出日時が undefined の場合、「提出時刻の記録が不正です。システム管理者に連絡してください。」という例外がスローされる', async () => {
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
          dailyReportId: 'RPT002',
          userId: 'reporter_B',
          reportDate: '2024-01-15',
          businessContent: '本日の業務内容',
          submittedAt: undefined,
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
      '提出時刻の記録が不正です。システム管理者に連絡してください。'
    );
  });

  it('提出日時が不完全なDate型の場合、「提出時刻の記録が不正です。システム管理者に連絡してください。」という例外がスローされる', async () => {
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
          dailyReportId: 'RPT003',
          userId: 'reporter_C',
          reportDate: '2024-01-15',
          businessContent: '本日の業務内容',
          submittedAt: 'invalid-date',
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
      '提出時刻の記録が不正です。システム管理者に連絡してください。'
    );
  });
});
