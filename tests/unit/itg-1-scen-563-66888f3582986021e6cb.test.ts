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

describe('SCEN-563: 提出済み日報をフォーマットするとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対象日が「YYYY年MM月DD日（曜日）」形式、提出時刻が「HH:MM」形式で表示され、17:00超過時は遅延フラグが立つ', async () => {
    const leaderId = 'LEADER001';
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
          businessContent: '本日の業務内容テスト',
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

    const result = await retrieveLeaderDashboardData(input);

    expect(result.submittedReports).toBeDefined();
    expect(result.submittedReports.length).toBe(1);

    const report = result.submittedReports[0];

    // displayDate should be in format 'YYYY年MM月DD日（曜日）'
    if ('displayDate' in report) {
      expect(report.displayDate).toMatch(/^\d{4}年\d{2}月\d{2}日（[月火水木金土日]）$/);
      expect(report.displayDate).toBe('2024年01月15日（月）');
    }

    // displayReporterName should be displayed as is
    if ('displayReporterName' in report) {
      expect(report.displayReporterName).toBe('田中太郎');
    }

    // displaySubmissionTime should be in format 'HH:MM'
    if ('displaySubmissionTime' in report) {
      expect(report.displaySubmissionTime).toMatch(/^\d{2}:\d{2}$/);
      expect(report.displaySubmissionTime).toBe('16:45');
    }

    // displayContent should be displayed as is
    if ('displayContent' in report) {
      expect(report.displayContent).toBe('本日の業務内容テスト');
    }

    // isLate should be false for submission time 16:45
    if ('isLate' in report) {
      expect(report.isLate).toBe(false);
    }
  });

  it('提出時刻が17:00を超過する場合、isLate フラグが true になる', async () => {
    const leaderId = 'LEADER001';
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
          businessContent: '業務内容',
          submittedAt: '2024-01-15T17:01:00',
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

    const result = await retrieveLeaderDashboardData(input);

    expect(result.submittedReports.length).toBe(1);
    const report = result.submittedReports[0];

    // displaySubmissionTime should be in format 'HH:MM'
    if ('displaySubmissionTime' in report) {
      expect(report.displaySubmissionTime).toBe('17:01');
    }

    // isLate should be true for submission time 17:01
    if ('isLate' in report) {
      expect(report.isLate).toBe(true);
    }
  });
});
