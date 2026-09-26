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
import { submitDailyReport } from '../../src/logic/daily-report-submission';
import { sendLeaderSubmissionNotification, sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';

class LeaderNotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeaderNotificationError';
  }
}

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>;
const mockedSubmitDailyReport = submitDailyReport as jest.MockedFunction<any>;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.MockedFunction<any>;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.MockedFunction<any>;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.MockedFunction<any>;

const REPORTERS = [
  { reporterId: 'R001', userId: 'U001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R002', userId: 'U002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R003', userId: 'U003', reporterName: '報告者3', emailAddress: 'r003@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R004', userId: 'U004', reporterName: '報告者4', emailAddress: 'r004@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R005', userId: 'U005', reporterName: '報告者5', emailAddress: 'r005@example.com', department: '総務部', status: 'active' },
];

describe('SCEN-006: 提出済みの日報に対するリーダーへの通知送信に失敗し、通知エラーが記録される', () => {
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

    mockedSendLeaderSubmissionNotification.mockRejectedValue(
      new LeaderNotificationError(
        'リーダーへの通知送信に失敗しました。メール送信状態を確認してください。'
      )
    );

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      success: true,
      nonSubmittedReporters: [
        { userId: 'U005', reporterName: '報告者5', emailAddress: 'r005@example.com' },
      ],
      totalDetected: 1,
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockImplementation((input: any) =>
      Promise.resolve({
        success: true,
        notificationId: `PROMPT-${input.reporterId}`,
        sentAt: new Date('2024-01-15T17:05:00+09:00'),
        deliveryMethod: 'email',
        errorDetails: null,
      })
    );
  });

  it('リーダー通知失敗によりpartial_success、通知送信0、催促は成功', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    }, mockAiClient);

    expect(result.executionStatus).toBe('partial_success');
    expect(result.leaderNotificationsSent).toBe(0);
    expect(result.promptsSent).toBeGreaterThanOrEqual(1);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.errorCode.includes('LeaderNotificationError'))).toBe(true);
    expect(result.errors?.[0].errorMessage).toBe(
      'リーダーへの通知送信に失敗しました。メール送信状態を確認してください。'
    );
    expect(result.executionSummary).toContain('通知送信に失敗');
  });
});
