import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
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

// 依存先のモック
jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/business-day-deadline-judgment.ts');
jest.mock('../../src/logic/daily-report-persistence.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-563: 提出済み日報をフォーマットするとき、対象日が「YYYY年MM月DD日（曜日）」形式、提出時刻が「HH:MM」形式で表示され、17:00超過時は遅延フラグが立つ', () => {
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

    // 提出済み日報をモック化
    const mockDailyReport = {
      reportId: 'RPT001',
      reporterName: '田中太郎',
      submissionDateTime: new Date('2024-01-15T16:45:00'),
      reportContent: '本日の業務内容テスト',
      reportDate: new Date('2024-01-15'),
    };

    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([mockDailyReport]);

    // 検知ログは空
    // @ts-ignore
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

    // メール送信履歴は空
    // @ts-ignore
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('提出時刻が16:45（17:00以下）の場合、isLateはfalseとなり、フォーマットが正しく適用される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'LEADER001',
      targetDate: '2024-01-15',
    };

    // 実行
    // @ts-ignore
    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    // 出力が正常に返却されていることを検証
    expect(output).toBeDefined();
    expect(output.submittedReports).toBeDefined();
    expect(Array.isArray(output.submittedReports)).toBe(true);
    expect(output.submittedReports.length).toBe(1);

    const report = output.submittedReports[0];

    // (1) displayDate='2024年01月15日（月）'（YYYY年MM月DD日（曜日）形式）
    expect(report.displayDate).toBe('2024年01月15日（月）');

    // (2) displayReporterName='田中太郎'（報告者名をそのまま表示）
    expect(report.displayReporterName).toBe('田中太郎');

    // (3) displaySubmissionTime='16:45'（HH:MM形式で提出時刻を表示）
    expect(report.displaySubmissionTime).toBe('16:45');

    // (4) displayContent='本日の業務内容テスト'（報告内容をそのまま表示）
    expect(report.displayContent).toBe('本日の業務内容テスト');

    // (5) isLate=false（提出時刻16:45は17:00以下のため遅延フラグなし）
    expect(report.isLate).toBe(false);
  });

  it('提出時刻が17:01（17:00超過）の場合、isLateはtrueとなる', async () => {
    // モック日報を17:01の時間で更新
    const mockDailyReportLate = {
      reportId: 'RPT002',
      reporterName: '山田次郎',
      submissionDateTime: new Date('2024-01-15T17:01:00'),
      reportContent: '本日の業務内容テスト',
      reportDate: new Date('2024-01-15'),
    };

    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([mockDailyReportLate]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'LEADER001',
      targetDate: '2024-01-15',
    };

    // 実行
    // @ts-ignore
    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    const report = output.submittedReports[0];

    // displaySubmissionTime='17:01'
    expect(report.displaySubmissionTime).toBe('17:01');

    // isLate=true（提出時刻17:01は17:00超過のため遅延フラグあり）
    expect(report.isLate).toBe(true);
  });

  it('提出時刻が17:00ちょうどの場合、isLateはfalseとなる', async () => {
    // モック日報を17:00ちょうどで設定
    const mockDailyReportExactly = {
      reportId: 'RPT003',
      reporterName: '鈴木太郎',
      submissionDateTime: new Date('2024-01-15T17:00:00'),
      reportContent: '本日の業務内容テスト',
      reportDate: new Date('2024-01-15'),
    };

    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([mockDailyReportExactly]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'LEADER001',
      targetDate: '2024-01-15',
    };

    // 実行
    // @ts-ignore
    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    const report = output.submittedReports[0];

    // displaySubmissionTime='17:00'
    expect(report.displaySubmissionTime).toBe('17:00');

    // isLate=false（17:00ちょうどは超過ではないため遅延フラグなし）
    expect(report.isLate).toBe(false);
  });
});
