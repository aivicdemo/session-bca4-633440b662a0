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
}));

import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
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

const REPORTERS = [
  { reporterId: 'R001', userId: 'U001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R002', userId: 'U002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R003', userId: 'U003', reporterName: '報告者3', emailAddress: 'r003@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R004', userId: 'U004', reporterName: '報告者4', emailAddress: 'r004@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R005', userId: 'U005', reporterName: '報告者5', emailAddress: 'r005@example.com', department: '総務部', status: 'active' },
];

describe('SCEN-001: 業務終了時刻判定成功・報告者5名全員が提出・リーダー通知完了', () => {
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

    mockedSubmitDailyReport.mockImplementation((input: any) =>
      Promise.resolve({
        dailyReportId: `DR-${input.userId}`,
        userId: input.userId,
        reportDate: '2024-01-15',
        submissionTimestamp: '2024-01-15T17:03:00+09:00',
        submissionStatus: 'submitted',
        notificationTriggered: true,
        completionMessage: '日報を提出しました。',
      })
    );

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

  it('報告者5名全員が入力を促され、提出・通知が完結し、催促が発生しない', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    }, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(5);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.promptsSent).toBe(0);
    expect(result.leaderNotificationsSent).toBe(5);
    expect(result.errors ?? []).toEqual([]);
    expect(result.executionSummary).toMatch(/5/);
  });
});
