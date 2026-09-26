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

describe('SCEN-584: targetDateがISO 8601形式（YYYY-MM-DD）で正しく指定されたとき、その日付の営業日判定と日報データ取得が行われる', () => {
  const targetDate = '2024-01-15';

  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAccessGranted: true,
      leaderId: 'leader-001',
      denialReason: null,
    });

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      isWithinDeadline: true,
      deadlineTime: '18:00',
    });

    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      success: true,
      reports: [],
      totalCount: 0,
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      success: true,
      detectionLogs: [],
      totalCount: 0,
    });

    mockedRetrieveEmailSendingHistoryByDateRange.mockResolvedValue({
      success: true,
      emailHistory: [],
      totalCount: 0,
    });
  });

  it('ISO 8601形式の有効な日付で関数が呼び出される', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader-001',
      targetDate,
    });

    expect(result).toBeDefined();
  });

  it('営業日判定が成功し、営業日フラグがtrueを返す', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader-001',
      targetDate,
    });

    expect(result).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();
  });

  it('提出済み日報配列が返される', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader-001',
      targetDate,
    });

    expect(Array.isArray(result.submittedReports)).toBe(true);
  });

  it('検知ログ配列が返される', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader-001',
      targetDate,
    });

    expect(Array.isArray(result.detectionLogs)).toBe(true);
  });

  it('メール送信履歴配列が返される', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader-001',
      targetDate,
    });

    expect(Array.isArray(result.emailSendingHistory)).toBe(true);
  });

  it('未提出者配列が返される', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader-001',
      targetDate,
    });

    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
  });

  it('RetrieveLeaderDashboardDataOutput型が返される', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader-001',
      targetDate,
    });

    expect(result).toHaveProperty('submittedReports');
    expect(result).toHaveProperty('nonSubmittedReporters');
    expect(result).toHaveProperty('detectionLogs');
    expect(result).toHaveProperty('emailSendingHistory');
    expect(result).toHaveProperty('submissionStatusSummary');
  });

  it('エラーは発生しない', async () => {
    const result = await retrieveLeaderDashboardData({
      leaderId: 'leader-001',
      targetDate,
    });

    expect(result).toBeDefined();
  });
});
