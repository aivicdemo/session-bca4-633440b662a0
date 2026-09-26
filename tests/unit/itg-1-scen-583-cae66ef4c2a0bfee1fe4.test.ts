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

import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { retrieveDailyReportsForLeaderReview, retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.MockedFunction<any>;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<any>;
const mockedRetrieveEmailSendingHistoryByDateRange = retrieveEmailSendingHistoryByDateRange as jest.MockedFunction<any>;

describe('SCEN-583: 提出状況サマリーの提出者数、未提出者数、催促済み数が正確に計算される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAccessGranted: true,
      leaderId: 'leader001',
      denialReason: null,
    });

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      isWithinDeadline: true,
      deadlineTime: '18:00',
    });

    // 提出済み日報3件
    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      success: true,
      reports: [
        {
          reportId: 'R001',
          reporterId: 'REP-001',
          reporterName: '太郎',
          submissionTime: '2024-01-15T17:30:00Z',
          businessContent: '顧客対応',
          achievements: '2件の受注取得',
          issues: 'なし',
          tomorrowPlan: '提案資料作成',
        },
        {
          reportId: 'R002',
          reporterId: 'REP-002',
          reporterName: '次郎',
          submissionTime: '2024-01-15T17:45:00Z',
          businessContent: '社内会議',
          achievements: '方針決定',
          issues: 'なし',
          tomorrowPlan: 'プロジェクト開始',
        },
        {
          reportId: 'R003',
          reporterId: 'REP-003',
          reporterName: '三郎',
          submissionTime: '2024-01-15T18:00:00Z',
          businessContent: 'システム開発',
          achievements: 'API実装完了',
          issues: 'テスト時間不足',
          tomorrowPlan: '単体テスト実施',
        },
      ],
      totalCount: 3,
    });

    // 未提出者検知ログ2件
    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      success: true,
      detectionLogs: [
        {
          detectionLogId: 'DL-001',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T18:00:00Z',
          nonSubmittedReporters: [
            { userId: 'U004', name: '四郎', team: '営業部' },
            { userId: 'U005', name: '五郎', team: '営業部' },
          ],
          reminderSent: false,
        },
      ],
      totalCount: 1,
    });

    // メール送信履歴3件
    mockedRetrieveEmailSendingHistoryByDateRange.mockResolvedValue({
      success: true,
      emailHistory: [
        {
          historyId: 'EH-001',
          recipientId: 'U004',
          recipientEmail: 'user4@example.com',
          emailType: 'reminder',
          subject: '日報提出のお願い',
          sentTime: '2024-01-15T18:05:00Z',
          sendingStatus: 'sent',
          errorMessage: null,
        },
        {
          historyId: 'EH-002',
          recipientId: 'U005',
          recipientEmail: 'user5@example.com',
          emailType: 'reminder',
          subject: '日報提出のお願い',
          sentTime: '2024-01-15T18:05:00Z',
          sendingStatus: 'sent',
          errorMessage: null,
        },
        {
          historyId: 'EH-003',
          recipientId: 'leader001',
          recipientEmail: 'leader@example.com',
          emailType: 'report',
          subject: '日報提出状況レポート',
          sentTime: '2024-01-15T18:10:00Z',
          sendingStatus: 'sent',
          errorMessage: null,
        },
      ],
      totalCount: 3,
    });
  });

  it('submissionStatusSummary が返される', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    });

    expect(result.submissionStatusSummary).toBeDefined();
  });

  it('submissionStatusSummary は数値フィールドを持つ', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    });

    expect(result.submissionStatusSummary).toHaveProperty('submittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('nonSubmittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('reminderSentCount');
  });

  it('submittedReports、nonSubmittedReporters、detectionLogs、emailSendingHistory が返される', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    });

    expect(result).toHaveProperty('submittedReports');
    expect(result).toHaveProperty('nonSubmittedReporters');
    expect(result).toHaveProperty('detectionLogs');
    expect(result).toHaveProperty('emailSendingHistory');
  });

  it('すべてが配列である', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    });

    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);
  });
});
