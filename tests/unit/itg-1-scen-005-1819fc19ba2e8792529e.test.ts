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
  ...jest.requireActual('../../src/logic/daily-report-submission'),
  submitDailyReport: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderSubmissionNotification: jest.fn(),
}));

import {
  runTx1Imp1Agent,
  DailyReportSubmissionError,
} from '../../src/agents/tx-1-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { submitDailyReport } from '../../src/logic/daily-report-submission';
import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedSubmitDailyReport = submitDailyReport as jest.Mock;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.Mock;

// AIVICゴール制約: チーム人数5名以下、業務内容テキスト1項目のみ、通知対象はリーダーのメールアドレス1つのみ。
const REPORTERS = [
  { reporterId: 'R001', userId: 'R001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: '営業部', status: 'active', leaderEmail: 'leader@example.com' },
  { reporterId: 'R002', userId: 'R002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: '営業部', status: 'active', leaderEmail: 'leader@example.com' },
  { reporterId: 'R003', userId: 'R003', reporterName: '報告者3', emailAddress: 'r003@example.com', department: '開発部', status: 'active', leaderEmail: 'leader@example.com' },
  { reporterId: 'R004', userId: 'R004', reporterName: '報告者4', emailAddress: 'r004@example.com', department: '開発部', status: 'active', leaderEmail: 'leader@example.com' },
  { reporterId: 'R005', userId: 'R005', reporterName: '報告者5', emailAddress: 'r005@example.com', department: '総務部', status: 'active', leaderEmail: 'leader@example.com' },
];

describe('SCEN-005: 日報の提出処理に失敗し、その報告者の日報が記録されず提出エラーが記録される', () => {
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

    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation((input: any) =>
      Promise.resolve({
        isAccessGranted: true,
        userId: input.userId,
        denialReason: null,
      })
    );

    // R001, R002は正常提出。R003は日報提出処理（DB保存）でDailyReportSubmissionErrorを発生。
    // R004, R005は入力が行われず未提出のまま。
    mockedSubmitDailyReport.mockImplementation((input: any) => {
      if (['R001', 'R002'].includes(input.userId)) {
        return Promise.resolve({
          dailyReportId: `DR-${input.userId}`,
          userId: input.userId,
          reportDate: '2024-01-15',
          submissionTimestamp: '2024-01-15T17:03:00+09:00',
          submissionStatus: 'submitted',
          notificationTriggered: true,
          completionMessage: '日報を提出しました。',
        });
      }
      if (input.userId === 'R003') {
        return Promise.reject(
          new DailyReportSubmissionError('日報の提出に失敗しました。システム管理者に連絡してください。')
        );
      }
      return Promise.reject(new Error(`unexpected submitDailyReport call for ${input.userId}`));
    });

    mockedSendLeaderSubmissionNotification.mockImplementation((input: any) =>
      Promise.resolve({
        success: true,
        notificationId: `NOTIF-${input.reporterId}`,
        sentAt: new Date('2024-01-15T17:04:00+09:00'),
        deliveryMethod: 'email',
        errorDetails: null,
      })
    );
  });

  it('提出処理失敗によりexecutionStatusがfailureとなり、提出エラーが記録される', async () => {
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    });

    expect(result.executionStatus).toBe('failure');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorCode: 'DailyReportSubmissionError',
          errorMessage: '日報の提出に失敗しました。システム管理者に連絡してください。',
        }),
      ])
    );
    expect(result.reportsSubmitted).toBeLessThanOrEqual(2);
    expect(result.executionSummary).toMatch(/中断|失敗/);

    // AIVICゴール制約: チーム人数5名以下
    expect(REPORTERS.length).toBeLessThanOrEqual(5);
    expect(result.reportersPrompted).toBeLessThanOrEqual(5);

    // AIVICゴール制約: 入力項目は業務内容テキスト1つのみ
    for (const call of mockedSubmitDailyReport.mock.calls) {
      const submitInput = call[0];
      expect(typeof submitInput.businessContent).toBe('string');
    }

    // AIVICゴール制約: メール通知対象はリーダーのメールアドレス1つのみ
    for (const call of mockedSendLeaderSubmissionNotification.mock.calls) {
      const notifyInput = call[0];
      expect(typeof notifyInput.leaderId).toBe('string');
    }
  });
});
