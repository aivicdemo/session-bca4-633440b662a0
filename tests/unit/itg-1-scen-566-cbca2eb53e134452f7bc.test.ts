import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';

// 依存先のモック
jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn().mockImplementation(() => Promise.resolve({})),
}));

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  judgeBusinessDayAndDeadline: jest.fn().mockImplementation(() => Promise.resolve({})),
}));

jest.mock('../../src/logic/daily-report-non-submission-detection.ts', () => ({
  retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockImplementation(() => Promise.resolve([])),
}));

jest.mock('../../src/logic/email-notification-management.ts', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn().mockImplementation(() => Promise.resolve([])),
}));

jest.mock('../../src/logic/daily-report-persistence.ts', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn().mockImplementation(() => Promise.resolve([])),
}));

describe('SCEN-566: 提出済み日報の報告者名が登録されていない場合、警告ログが記録される', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockJudgeBusinessDayAndDeadline: jest.Mock;
  let mockRetrieveNonSubmissionDetectionLogsByDate: jest.Mock;
  let mockRetrieveEmailSendingHistoryByDateRange: jest.Mock;
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticateAndAuthorizeLeaderAccess = require('../../src/logic/user-authentication-authorization.ts')
      .authenticateAndAuthorizeLeaderAccess as jest.Mock;
    mockJudgeBusinessDayAndDeadline = require('../../src/logic/business-day-deadline-judgment.ts')
      .judgeBusinessDayAndDeadline as jest.Mock;
    mockRetrieveNonSubmissionDetectionLogsByDate = require('../../src/logic/daily-report-non-submission-detection.ts')
      .retrieveNonSubmissionDetectionLogsByDate as jest.Mock;
    mockRetrieveEmailSendingHistoryByDateRange = require('../../src/logic/email-notification-management.ts')
      .retrieveEmailSendingHistoryByDateRange as jest.Mock;
    mockRetrieveDailyReportsForLeaderReview = require('../../src/logic/daily-report-persistence.ts')
      .retrieveDailyReportsForLeaderReview as jest.Mock;

    // 成功応答に設定
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({});
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({});
    // @ts-ignore
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    // @ts-ignore
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('提出済み日報の報告者名が null の場合、検知ログに警告が記録される', async () => {
    // 提出済み日報データを準備。reporterName が null
    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([
      {
        reportId: 'report-001',
        reporterName: null,
        submissionDateTime: new Date('2024-01-15T14:30:00'),
        reportContent: '本日の業務内容',
        reportDate: new Date('2024-01-15'),
      },
    ]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    // 実行
    // @ts-ignore
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    // 戻り値の detectionLogs 配列に警告ログが記録されていることを検証
    expect(result.detectionLogs).toBeDefined();
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(result.detectionLogs.length).toBeGreaterThanOrEqual(1);

    // 警告ログの内容を確認
    const warningLog = result.detectionLogs.find(
      (log: any) => log.message && log.message.includes('報告者情報が見つかりません')
    );
    expect(warningLog).toBeDefined();
    expect(warningLog?.type).toBe('warn');
    expect(warningLog?.reportId).toBe('report-001');
  });

  it('提出済み日報の報告者名が空文字列の場合、検知ログに警告が記録される', async () => {
    // 提出済み日報データを準備。reporterName が空文字列
    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([
      {
        reportId: 'report-002',
        reporterName: '',
        submissionDateTime: new Date('2024-01-15T14:30:00'),
        reportContent: '本日の業務内容',
        reportDate: new Date('2024-01-15'),
      },
    ]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    // 実行
    // @ts-ignore
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    // 戻り値の detectionLogs 配列に警告ログが記録されていることを検証
    expect(result.detectionLogs).toBeDefined();
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(result.detectionLogs.length).toBeGreaterThanOrEqual(1);

    // 警告ログの内容を確認
    const warningLog = result.detectionLogs.find(
      (log: any) => log.message && log.message.includes('報告者情報が見つかりません')
    );
    expect(warningLog).toBeDefined();
    expect(warningLog?.type).toBe('warn');
    expect(warningLog?.reportId).toBe('report-002');
  });

  it('正常な報告者名を持つ日報は警告ログの対象にならない', async () => {
    // 正常な報告者名を持つ日報
    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([
      {
        reportId: 'report-003',
        reporterName: '太郎 花子',
        submissionDateTime: new Date('2024-01-15T14:30:00'),
        reportContent: '本日の業務内容',
        reportDate: new Date('2024-01-15'),
      },
    ]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    // 実行
    // @ts-ignore
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    // 正常系に関する出力は定義された構造を持つ
    expect(result.submittedReports).toBeDefined();
    expect(Array.isArray(result.submittedReports)).toBe(true);

    expect(result.nonSubmittedReporters).toBeDefined();
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);

    expect(result.emailSendingHistory).toBeDefined();
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);

    expect(result.submissionStatusSummary).toBeDefined();

    // 警告ログが記録されていないことを検証
    expect(result.detectionLogs).toBeDefined();
    const warningLog = result.detectionLogs.find(
      (log: any) => log.message && log.message.includes('報告者情報が見つかりません')
    );
    expect(warningLog).toBeUndefined();
  });
});
