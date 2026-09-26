import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-submission', () => ({
  submitDailyReport: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderSubmissionNotification: jest.fn(),
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));

import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>;

class ReporterAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReporterAuthenticationError';
  }
}

const REPORTERS = [
  { reporterId: 'R001', userId: 'U001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R002', userId: 'U002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R003', userId: 'U003', reporterName: '報告者3', emailAddress: 'r003@example.com', department: '開発部', status: 'active' },
];

describe('SCEN-003: 報告者の認証・認可に失敗し、対象報告者への入力促通知が送信されず、その報告者の結果に認証エラーが記録される', () => {
  const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
  const targetDate = new Date('2024-01-15T00:00:00+09:00');
  const systemContext = {
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
    auth: { isAuthenticated: true },
  };

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: REPORTERS,
      totalCount: REPORTERS.length,
      message: '対象報告者を取得しました。',
    });

    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation((input: any) => {
      if (input.userId === 'U001') {
        return Promise.reject(
          new ReporterAuthenticationError(
            '従業員の認証に失敗しました。ログイン状態を確認してください。'
          )
        );
      }
      return Promise.resolve({
        isAccessGranted: true,
        userId: input.userId,
        denialReason: null,
      });
    });
  });

  it('認証失敗した報告者への入力促が送信されず、エラーが記録される', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    }, mockAiClient);

    expect(result.executionStatus).toMatch(/partial_success|failure/);
    expect(result.reportersPrompted).toBe(0);
    expect(result.nonSubmittedReporters).toBeDefined();
    expect(result.nonSubmittedReporters.length).toBeGreaterThan(0);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors?.[0].errorCode).toContain('ReporterAuthenticationError');
    expect(result.errors?.[0].errorMessage).toBe(
      '従業員の認証に失敗しました。ログイン状態を確認してください。'
    );
    expect(result.executionSummary).toContain('認証に失敗');
  });
});
