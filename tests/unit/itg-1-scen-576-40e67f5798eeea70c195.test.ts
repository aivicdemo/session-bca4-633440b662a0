import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import {
  authenticateAndAuthorizeLeaderAccess,
} from '../../src/logic/user-authentication-authorization';
import {
  judgeBusinessDayAndDeadline,
} from '../../src/logic/business-day-deadline-judgment';
import {
  retrieveDailyReportsForLeaderReview,
  retrieveNonSubmissionDetectionLogsByDate,
} from '../../src/logic/daily-report-persistence';
import {
  retrieveEmailSendingHistoryByDateRange,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-576: 本日の提出済み日報が0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // authenticateAndAuthorizeLeaderAccess をスタブ化
    jest.mocked(authenticateAndAuthorizeLeaderAccess).mockResolvedValue({
      isAuthorized: true,
      leaderId: 'leader-001',
    });

    // judgeBusinessDayAndDeadline をスタブ化
    jest.mocked(judgeBusinessDayAndDeadline).mockResolvedValue({
      isBusinessDay: true,
      isWithinDeadline: true,
      targetDate: '2024-01-15',
    });

    // retrieveDailyReportsForLeaderReview をスタブ化 - 提出済み日報は0件
    jest.mocked(retrieveDailyReportsForLeaderReview).mockResolvedValue({
      submittedReports: [],
    });

    // retrieveNonSubmissionDetectionLogsByDate をスタブ化 - 検知ログを返す
    jest.mocked(retrieveNonSubmissionDetectionLogsByDate).mockResolvedValue({
      detectionLogs: [
        {
          detectionLogId: 'log-001',
          targetDate: '2024-01-15',
          detectionTimestamp: 1705276800000,
          nonSubmittedCount: 2,
        },
      ],
    });

    // retrieveEmailSendingHistoryByDateRange をスタブ化 - メール送信履歴を返す
    jest.mocked(retrieveEmailSendingHistoryByDateRange).mockResolvedValue({
      emailSendingHistory: [
        {
          emailHistoryId: 'email-001',
          sendingTime: '2024-01-15T10:00:00Z',
          sendingStatus: 'sent',
          recipientCount: 2,
        },
      ],
    });
  });

  it('本日の提出済み日報が0件のとき、submittedReports フィールドが空配列となる', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    const result = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    expect(result).toHaveProperty('submittedReports');
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.submittedReports).toEqual([]);

    // 出力型 RetrieveLeaderDashboardDataOutput で期待される他のフィールドも存在
    expect(result).toHaveProperty('nonSubmittedReporters');
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(result).toHaveProperty('detectionLogs');
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(result).toHaveProperty('emailSendingHistory');
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);
    expect(result).toHaveProperty('submissionStatusSummary');

    // 各依存先が正しく呼ばれたことを確認
    expect(jest.mocked(authenticateAndAuthorizeLeaderAccess)).toHaveBeenCalledWith({
      leaderId,
    });
    expect(jest.mocked(judgeBusinessDayAndDeadline)).toHaveBeenCalledWith({
      targetDate,
    });
    expect(jest.mocked(retrieveDailyReportsForLeaderReview)).toHaveBeenCalledWith({
      targetDate,
    });
    expect(jest.mocked(retrieveNonSubmissionDetectionLogsByDate)).toHaveBeenCalledWith({
      targetDate,
    });
    expect(jest.mocked(retrieveEmailSendingHistoryByDateRange)).toHaveBeenCalled();
  });
});
