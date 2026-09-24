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

import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { retrieveDailyReportsForLeaderReview, retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.Mock;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.Mock;
const mockedRetrieveEmailSendingHistoryByDateRange = retrieveEmailSendingHistoryByDateRange as jest.Mock;

describe('SCEN-559: リーダーが有効な認証情報で管理画面にアクセスしたとき、本日の提出済み日報一覧、未提出者一覧、検知ログ、メール送信履歴を集約したダッシュボードデータが返される', () => {
  const leaderId = 'leader001';
  const targetDate = '2024-01-15';

  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAuthorized: true,
      leaderId: leaderId,
      role: 'leader',
    });

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      isWithinDeadline: true,
      deadline: '2024-01-16T09:00:00Z',
    });

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      reports: [
        {
          reportId: 'report001',
          reporterId: 'reporter001',
          reporterName: '報告者A',
          submissionDateTime: '2024-01-15T08:30:00Z',
          reportContent: '本日の業務内容：プロジェクト進捗確認',
          reportDate: '2024-01-15',
        },
        {
          reportId: 'report002',
          reporterId: 'reporter002',
          reporterName: '報告者B',
          submissionDateTime: '2024-01-15T09:15:00Z',
          reportContent: '会議出席、資料作成',
          reportDate: '2024-01-15',
        },
      ],
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      detectionLogs: [
        {
          detectionLogId: 'log001',
          reporterId: 'reporter003',
          reporterName: '報告者C',
          detectionDateTime: '2024-01-15T10:00:00Z',
          detectionStatus: 'unsubmitted',
          reminderSent: false,
        },
        {
          detectionLogId: 'log002',
          reporterId: 'reporter004',
          reporterName: '報告者D',
          detectionDateTime: '2024-01-15T10:05:00Z',
          detectionStatus: 'unsubmitted',
          reminderSent: false,
        },
        {
          detectionLogId: 'log003',
          reporterId: 'reporter005',
          reporterName: '報告者E',
          detectionDateTime: '2024-01-15T10:10:00Z',
          detectionStatus: 'unsubmitted',
          reminderSent: false,
        },
      ],
    });

    mockedRetrieveEmailSendingHistoryByDateRange.mockResolvedValue({
      emailHistory: [
        {
          emailHistoryId: 'email001',
          sentAt: '2024-01-15T09:00:00Z',
          emailType: 'reminder',
          recipientId: 'reporter003',
          recipientEmail: 'reporter003@example.com',
          status: 'success',
        },
        {
          emailHistoryId: 'email002',
          sentAt: '2024-01-15T09:30:00Z',
          emailType: 'submission_notification',
          recipientId: 'reporter001',
          recipientEmail: 'reporter001@example.com',
          status: 'success',
        },
      ],
    });
  });

  it('リーダーが有効な認証情報でアクセスしたとき、本日の提出済み日報一覧、未提出者一覧、検知ログ、メール送信履歴を集約したダッシュボードデータが返される', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    expect(result).toBeDefined();
    expect(result.submittedReports).toBeDefined();
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.submittedReports.length).toBe(2);

    result.submittedReports.forEach((report: any) => {
      expect(report).toHaveProperty('displayDate');
      expect(report).toHaveProperty('displayReporterName');
      expect(report).toHaveProperty('displaySubmissionTime');
      expect(report).toHaveProperty('displayContent');
      expect(report).toHaveProperty('isLate');
    });

    expect(result.submittedReports[0].displayDate).toMatch(/2024年01月15日/);
    expect(result.submittedReports[0].displayReporterName).toBe('報告者A');
    expect(result.submittedReports[0].displaySubmissionTime).toMatch(/\d{2}:\d{2}/);
    expect(result.submittedReports[0].displayContent).toBe('本日の業務内容：プロジェクト進捗確認');
    expect(typeof result.submittedReports[0].isLate).toBe('boolean');

    expect(result.submittedReports[1].displayDate).toMatch(/2024年01月15日/);
    expect(result.submittedReports[1].displayReporterName).toBe('報告者B');
    expect(result.submittedReports[1].displaySubmissionTime).toMatch(/\d{2}:\d{2}/);

    expect(result.nonSubmittedReporters).toBeDefined();
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(result.nonSubmittedReporters.length).toBe(3);

    result.nonSubmittedReporters.forEach((reporter: any) => {
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('name');
    });

    expect(result.nonSubmittedReporters[0].userId).toBe('reporter003');
    expect(result.nonSubmittedReporters[0].name).toBe('報告者C');
    expect(result.nonSubmittedReporters[1].userId).toBe('reporter004');
    expect(result.nonSubmittedReporters[1].name).toBe('報告者D');
    expect(result.nonSubmittedReporters[2].userId).toBe('reporter005');
    expect(result.nonSubmittedReporters[2].name).toBe('報告者E');

    expect(result.detectionLogs).toBeDefined();
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(result.detectionLogs.length).toBe(3);

    expect(result.emailSendingHistory).toBeDefined();
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);
    expect(result.emailSendingHistory.length).toBe(2);

    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.submissionStatusSummary).toHaveProperty('submittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('nonSubmittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('remindedCount');

    expect(result.submissionStatusSummary.submittedCount).toBe(2);
    expect(result.submissionStatusSummary.nonSubmittedCount).toBe(3);

    result.submittedReports.forEach((report: any) => {
      expect(report.displayDate).toContain('2024年01月15日');
    });

    result.detectionLogs.forEach((log: any) => {
      if (log.detectionDateTime) {
        expect(log.detectionDateTime).toContain('2024-01-15');
      }
    });

    result.emailSendingHistory.forEach((history: any) => {
      if (history.sentAt) {
        expect(history.sentAt).toContain('2024-01-15');
      }
    });
  });
});
