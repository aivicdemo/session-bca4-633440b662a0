import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
  MalformedSubmissionTimeError,
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

describe('SCEN-565: 提出済み日報の提出日時が不正な値の場合、提出時刻の記録が不正ですという例外がスローされる', () => {
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

  it('提出済み日報の提出日時が不正な値（null）の場合、「提出時刻の記録が不正です。システム管理者に連絡してください。」という例外がスローされる', async () => {
    // 提出済み日報1件を返す。submissionDateTime が null に設定
    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([
      {
        reportId: 'report-001',
        reporterName: '太郎 花子',
        submissionDateTime: null,
        reportContent: '本日の業務内容',
        reportDate: new Date('2024-01-15'),
      },
    ]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    };

    // 実行
    // @ts-ignore
    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('提出時刻の記録が不正です'),
      })
    );
  });

  it('提出済み日報の提出日時が不正な値（undefined）の場合、「提出時刻の記録が不正です。システム管理者に連絡してください。」という例外がスローされる', async () => {
    // 提出済み日報1件を返す。submissionDateTime が undefined に設定
    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([
      {
        reportId: 'report-001',
        reporterName: '太郎 花子',
        submissionDateTime: undefined,
        reportContent: '本日の業務内容',
        reportDate: new Date('2024-01-15'),
      },
    ]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    };

    // 実行
    // @ts-ignore
    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('提出時刻の記録が不正です'),
      })
    );
  });

  it('提出済み日報の提出日時が不正な値（不完全なDate型）の場合、「提出時刻の記録が不正です。システム管理者に連絡してください。」という例外がスローされる', async () => {
    // 提出済み日報1件を返す。submissionDateTime が不完全な Date オブジェクトに設定
    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([
      {
        reportId: 'report-001',
        reporterName: '太郎 花子',
        submissionDateTime: new Date('Invalid'),
        reportContent: '本日の業務内容',
        reportDate: new Date('2024-01-15'),
      },
    ]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    };

    // 実行
    // @ts-ignore
    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('提出時刻の記録が不正です'),
      })
    );
  });
});
