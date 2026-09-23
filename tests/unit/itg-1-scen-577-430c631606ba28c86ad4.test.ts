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

describe('SCEN-577: 本日の未提出者が複数件存在するとき、すべての未提出者情報が配列に集約される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // authenticateAndAuthorizeLeaderAccess をスタブ化 - リーダー認証・認可が成功
    jest.mocked(authenticateAndAuthorizeLeaderAccess).mockResolvedValue({
      isAuthorized: true,
      leaderId: 'leader-001',
    });

    // judgeBusinessDayAndDeadline をスタブ化 - targetDate が有効な営業日
    jest.mocked(judgeBusinessDayAndDeadline).mockResolvedValue({
      isBusinessDay: true,
      isWithinDeadline: true,
      targetDate: '2024-01-15',
    });

    // retrieveDailyReportsForLeaderReview をスタブ化 - 本日提出済みの日報を1件
    jest.mocked(retrieveDailyReportsForLeaderReview).mockResolvedValue({
      submittedReports: [
        {
          reportId: 'report-001',
          reporterId: 'reporter-001',
          reporterName: '山田太郎',
          submissionTime: '2024-01-15T09:30:00Z',
          businessContent: '営業活動',
          achievements: '新規顧客1件獲得',
          issues: 'なし',
          tomorrowPlan: '契約書作成',
        },
      ],
    });

    // retrieveNonSubmissionDetectionLogsByDate をスタブ化 - 未提出者3名を返す
    jest.mocked(retrieveNonSubmissionDetectionLogsByDate).mockResolvedValue({
      detectionLogs: [
        {
          detectionLogId: 'log-001',
          targetDate: '2024-01-15',
          detectionTimestamp: 1705276800000,
          nonSubmittedCount: 3,
          nonSubmittedReporters: [
            {
              userId: 'reporter-002',
              userName: '田中太郎',
              emailAddress: 'tanaka@example.com',
              promptSent: true,
            },
            {
              userId: 'reporter-003',
              userName: '佐藤花子',
              emailAddress: 'sato@example.com',
              promptSent: true,
            },
            {
              userId: 'reporter-004',
              userName: '鈴木次郎',
              emailAddress: 'suzuki@example.com',
              promptSent: false,
            },
          ],
        },
      ],
    });

    // retrieveEmailSendingHistoryByDateRange をスタブ化 - 本日のメール送信履歴を1件
    jest.mocked(retrieveEmailSendingHistoryByDateRange).mockResolvedValue({
      emailSendingHistory: [
        {
          emailHistoryId: 'email-001',
          sendingTime: '2024-01-15T10:00:00Z',
          sendingStatus: 'sent',
          recipientCount: 3,
        },
      ],
    });
  });

  it('本日の未提出者が複数件存在するとき、nonSubmittedReporters に全ての未提出者情報が集約される', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    const result = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    // nonSubmittedReporters フィールドが存在し、配列であることを確認
    expect(result).toHaveProperty('nonSubmittedReporters');
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);

    // 要素数が3であることを確認
    expect(result.nonSubmittedReporters.length).toBe(3);

    // 各要素が NonSubmittedReporterInfo 型の構造を持つことを確認
    result.nonSubmittedReporters.forEach((reporter, index) => {
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('userName');
      expect(reporter).toHaveProperty('emailAddress');
      expect(reporter).toHaveProperty('promptSent');
      expect(typeof reporter.userId).toBe('string');
      expect(typeof reporter.userName).toBe('string');
      expect(typeof reporter.emailAddress).toBe('string');
      expect(typeof reporter.promptSent).toBe('boolean');
    });

    // 田中太郎、佐藤花子、鈴木次郎の3名がすべて含まれていることを確認
    const reporterNames = result.nonSubmittedReporters.map(r => r.userName);
    expect(reporterNames).toContain('田中太郎');
    expect(reporterNames).toContain('佐藤花子');
    expect(reporterNames).toContain('鈴木次郎');

    // submittedReports フィールド - 提出済み日報は1件
    expect(result).toHaveProperty('submittedReports');
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.submittedReports.length).toBe(1);

    // submissionStatusSummary フィールドが存在し、本日の提出状況が正しく集計されている
    expect(result).toHaveProperty('submissionStatusSummary');
    expect(result.submissionStatusSummary).toHaveProperty('submittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('nonSubmittedCount');
    expect(result.submissionStatusSummary.submittedCount).toBe(1);
    expect(result.submissionStatusSummary.nonSubmittedCount).toBe(3);

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
  });
});
