import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
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

// 依存先のモック
jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/business-day-deadline-judgment.ts');
jest.mock('../../src/logic/daily-report-persistence.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-564: 提出済み日報の報告内容が空文字列またはnullの場合、「日報内容が記録されていません。データを確認してください。」という例外がスローされる', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockJudgeBusinessDayAndDeadline: jest.Mock;
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;
  let mockRetrieveNonSubmissionDetectionLogsByDate: jest.Mock;
  let mockRetrieveEmailSendingHistoryByDateRange: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAndAuthorizeLeaderAccess =
      authenticateAndAuthorizeLeaderAccess as jest.Mock;
    mockJudgeBusinessDayAndDeadline =
      judgeBusinessDayAndDeadline as jest.Mock;
    mockRetrieveDailyReportsForLeaderReview =
      retrieveDailyReportsForLeaderReview as jest.Mock;
    mockRetrieveNonSubmissionDetectionLogsByDate =
      retrieveNonSubmissionDetectionLogsByDate as jest.Mock;
    mockRetrieveEmailSendingHistoryByDateRange =
      retrieveEmailSendingHistoryByDateRange as jest.Mock;

    // authenticateAndAuthorizeLeaderAccess を成功状態で設定
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAuthorized: true,
    });

    // judgeBusinessDayAndDeadline を成功状態で設定
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
    });

    // 検知ログは空
    // @ts-ignore
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    // メール送信履歴は空
    // @ts-ignore
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('報告内容が空文字列の場合、「日報内容が記録されていません。データを確認してください。」という例外がスローされる', async () => {
    // reportContent が空文字列の日報をモック化
    const mockDailyReportEmpty = {
      reportId: 'RPT001',
      reporterName: '田中太郎',
      submissionDateTime: new Date('2024-01-15T16:45:00'),
      reportContent: '', // 空文字列
      reportDate: new Date('2024-01-15'),
    };

    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([mockDailyReportEmpty]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2025-01-15',
    };

    // 実行してエラーをキャッチ
    let thrownError: Error | null = null;
    try {
      // @ts-ignore
      await retrieveLeaderDashboardData(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // エラーがスローされたことを検証
    expect(thrownError).toBeDefined();

    // エラー文言が「日報内容が記録されていません。データを確認してください。」を含むことを検証
    expect(thrownError?.message).toContain('日報内容が記録されていません。データを確認してください。');
  });

  it('報告内容がnullの場合、「日報内容が記録されていません。データを確認してください。」という例外がスローされる', async () => {
    // reportContent が null の日報をモック化
    const mockDailyReportNull = {
      reportId: 'RPT002',
      reporterName: '山田次郎',
      submissionDateTime: new Date('2024-01-15T16:45:00'),
      reportContent: null, // null
      reportDate: new Date('2024-01-15'),
    };

    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([mockDailyReportNull]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2025-01-15',
    };

    // 実行してエラーをキャッチ
    let thrownError: Error | null = null;
    try {
      // @ts-ignore
      await retrieveLeaderDashboardData(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // エラーがスローされたことを検証
    expect(thrownError).toBeDefined();

    // エラー文言が「日報内容が記録されていません。データを確認してください。」を含むことを検証
    expect(thrownError?.message).toContain('日報内容が記録されていません。データを確認してください。');
  });

  it('複数の日報のうち、1件が空文字列の場合、エラーがスローされる', async () => {
    // 最初の日報は正常、2番目の日報は reportContent が空文字列
    const mockDailyReports = [
      {
        reportId: 'RPT001',
        reporterName: '田中太郎',
        submissionDateTime: new Date('2024-01-15T16:45:00'),
        reportContent: '本日の業務内容テスト',
        reportDate: new Date('2024-01-15'),
      },
      {
        reportId: 'RPT002',
        reporterName: '鈴木次郎',
        submissionDateTime: new Date('2024-01-15T16:30:00'),
        reportContent: '', // 空文字列
        reportDate: new Date('2024-01-15'),
      },
    ];

    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue(mockDailyReports);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2025-01-15',
    };

    // 実行してエラーをキャッチ
    let thrownError: Error | null = null;
    try {
      // @ts-ignore
      await retrieveLeaderDashboardData(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // エラーがスローされたことを検証
    expect(thrownError).toBeDefined();

    // エラー文言が「日報内容が記録されていません。データを確認してください。」を含むことを検証
    expect(thrownError?.message).toContain('日報内容が記録されていません。データを確認してください。');
  });
});
