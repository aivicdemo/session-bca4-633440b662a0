jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderSubmissionNotification: jest.fn(),
}));

import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.Mock;

// 認証失敗シナリオ: getActiveReportersForSubmissionCheck が返す対象報告者(複数人)全員について、
// authenticateAndAuthorizeReporterAccess がアクセス拒否結果を返すよう設定する。
// 詳細は .aivic/batches/25/unresolved.md の SCEN-003 の項を参照。
const REPORTERS = [
  { reporterId: 'R001', userId: 'U001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R002', userId: 'U002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: '営業部', status: 'active' },
];

describe('SCEN-003: 報告者の認証・認可に失敗し、入力促通知が送信されず認証エラーが記録される', () => {
  const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
  const targetDate = new Date('2024-01-15T00:00:00+09:00');
  const systemContext = {
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
    auth: { isAuthenticated: false, userId: 'U001' },
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

    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation((input: any) =>
      Promise.resolve({
        isAccessGranted: false,
        userId: input.userId,
        denialReason: 'INVALID_ROLE_OR_ACCOUNT',
      })
    );
  });

  it('認証失敗した報告者へは入力促通知が送信されず、認証エラーが記録される', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    }, mockAiClient);

    expect(['partial_success', 'failure']).toContain(result.executionStatus);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'ReporterAuthenticationError',
          errorMessage: '従業員の認証に失敗しました。ログイン状態を確認してください。',
        }),
      ])
    );
    expect(result.reportersPrompted).toBe(0);
    expect(result.nonSubmittedReporters.length).toBeGreaterThanOrEqual(REPORTERS.length);
    expect(
      result.nonSubmittedReporters.some((r: any) => r.userId === 'U001')
    ).toBe(true);
    expect(
      result.nonSubmittedReporters.some((r: any) => r.userId === 'U002')
    ).toBe(true);
    expect(result.executionSummary).toMatch(/認証/);
    expect(mockedSendLeaderSubmissionNotification).not.toHaveBeenCalled();
  });
});
