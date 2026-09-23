import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  LeaderAuthorizationFailedError,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
  SubmittedDailyReportSummary,
  NonSubmittedReporterSummary,
  EmailHistorySummary,
  SubmissionStatusSummary,
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

jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/business-day-deadline-judgment.ts');
jest.mock('../../src/logic/daily-report-persistence.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-559: リーダーが有効な認証情報で管理画面にアクセスしたとき、本日の提出済み日報一覧、未提出者一覧、検知ログ、メール送信履歴を集約したダッシュボードデータが返される', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockJudgeBusinessDayAndDeadline: jest.Mock;
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;
  let mockRetrieveNonSubmissionDetectionLogsByDate: jest.Mock;
  let mockRetrieveEmailSendingHistoryByDateRange: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.Mock;
    mockJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
    mockRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
    mockRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.Mock;
    mockRetrieveEmailSendingHistoryByDateRange = retrieveEmailSendingHistoryByDateRange as jest.Mock;

    // 認証・認可が成功
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAuthorized: true,
    });

    // 対象日付が営業日判定に合格
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      withinDeadline: true,
    });

    // 本日提出済みの日報を取得（例：報告者A、Bの2件）
    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      reports: [
        {
          reportId: 'R001',
          reporterName: '報告者A',
          submissionDateTime: '2024-01-15T14:30:00Z',
          reportContent: 'チーム会議を実施',
          reportDate: '2024-01-15',
        },
        {
          reportId: 'R002',
          reporterName: '報告者B',
          submissionDateTime: '2024-01-15T15:00:00Z',
          reportContent: 'プロジェクトAの進捗確認',
          reportDate: '2024-01-15',
        },
      ],
    });

    // 本日の未提出者検知ログを取得（例：報告者C、D、Eが未提出）
    // @ts-ignore
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      logs: [
        {
          userId: 'U003',
          name: '報告者C',
        },
        {
          userId: 'U004',
          name: '報告者D',
        },
        {
          userId: 'U005',
          name: '報告者E',
        },
      ],
    });

    // 本日のメール送信履歴を取得
    // @ts-ignore
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue({
      histories: [
        {
          sentAt: '2024-01-15T16:00:00Z',
          type: 'reminder',
          to: 'reporter@example.com',
          status: 'success',
        },
      ],
    });
  });

  it('本日の提出済み日報一覧、未提出者一覧、検知ログ、メール送信履歴を集約したダッシュボードデータが返される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    // 認証・認可が呼ばれたことを確認
    expect(mockAuthenticateAndAuthorizeLeaderAccess).toHaveBeenCalledWith(
      expect.objectContaining({ leaderId: 'leader001' })
    );

    // 営業日判定が呼ばれたことを確認
    expect(mockJudgeBusinessDayAndDeadline).toHaveBeenCalledWith(
      expect.objectContaining({ targetDate: '2024-01-15' })
    );

    // 提出済み日報取得が呼ばれたことを確認
    expect(mockRetrieveDailyReportsForLeaderReview).toHaveBeenCalled();

    // 未提出者検知ログ取得が呼ばれたことを確認
    expect(mockRetrieveNonSubmissionDetectionLogsByDate).toHaveBeenCalled();

    // メール送信履歴取得が呼ばれたことを確認
    expect(mockRetrieveEmailSendingHistoryByDateRange).toHaveBeenCalled();

    // 結果の構造を確認
    expect(result).toHaveProperty('submittedReports');
    expect(result).toHaveProperty('nonSubmittedReporters');
    expect(result).toHaveProperty('detectionLogs');
    expect(result).toHaveProperty('emailSendingHistory');
    expect(result).toHaveProperty('submissionStatusSummary');

    // 提出済み日報の件数を確認（2件）
    expect(result.submittedReports).toHaveLength(2);

    // 提出済み日報の形式を確認
    result.submittedReports.forEach((report: SubmittedDailyReportSummary) => {
      expect(report).toHaveProperty('displayDate');
      expect(report).toHaveProperty('displayReporterName');
      expect(report).toHaveProperty('displaySubmissionTime');
      expect(report).toHaveProperty('displayContent');
      expect(report).toHaveProperty('isLate');
    });

    // 日付フォーマットの確認（『2024年01月15日（月）』形式）
    expect(result.submittedReports[0].displayDate).toMatch(/^\d{4}年\d{2}月\d{2}日（[月火水木金土日]）$/);

    // 提出時刻フォーマットの確認（『HH:MM』形式）
    expect(result.submittedReports[0].displaySubmissionTime).toMatch(/^\d{2}:\d{2}$/);

    // 未提出者一覧の件数を確認（3件）
    expect(result.nonSubmittedReporters).toHaveLength(3);

    // 未提出者情報の形式を確認
    result.nonSubmittedReporters.forEach((reporter: NonSubmittedReporterSummary) => {
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('name');
    });

    // 提出状況サマリーを確認
    expect(result.submissionStatusSummary).toHaveProperty('submittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('nonSubmittedCount');
    expect(result.submissionStatusSummary.submittedCount).toBe(2);
    expect(result.submissionStatusSummary.nonSubmittedCount).toBe(3);

    // 全データが本日2024-01-15の集約結果として一貫性を保つ
    expect(result.submittedReports.every((r: SubmittedDailyReportSummary) => r.displayDate.includes('2024年01月15日')));
  });
});
