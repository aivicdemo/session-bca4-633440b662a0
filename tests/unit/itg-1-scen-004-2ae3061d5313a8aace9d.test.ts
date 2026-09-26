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

class DailyReportGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DailyReportGenerationError';
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

describe('SCEN-004: 簡潔な入力内容から詳細日報の生成に失敗し、その報告者の日報が提出されず、生成エラーが記録される', () => {
  const executionTimestamp = new Date('2024-01-15T17:05:00+09:00');
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

    mockedSubmitDailyReport.mockImplementation((input: any) => {
      if (input.userId === 'U003') {
        return Promise.reject(
          new DailyReportGenerationError(
            '日報の生成に失敗しました。入力内容を確認してください。'
          )
        );
      }
      return Promise.resolve({
        dailyReportId: `DR-${input.userId}`,
        userId: input.userId,
        reportDate: '2024-01-15',
        submissionTimestamp: '2024-01-15T17:03:00+09:00',
        submissionStatus: 'submitted',
        notificationTriggered: true,
        completionMessage: '日報を提出しました。',
      });
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

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      success: true,
      nonSubmittedReporters: [
        { userId: 'U004', reporterName: '報告者4', emailAddress: 'r004@example.com' },
        { userId: 'U005', reporterName: '報告者5', emailAddress: 'r005@example.com' },
      ],
      totalDetected: 2,
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

  it('R005の生成失敗により、partial_successで3名提出・2名未提出・2名へ催促', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    }, mockAiClient);

    expect(result.executionStatus).toBe('partial_success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);
    expect(result.nonSubmittedReporters.length).toBe(2);
    expect(result.promptsSent).toBe(2);
    expect(result.leaderNotificationsSent).toBe(3);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.errorCode.includes('DailyReportGenerationError'))).toBe(true);
    expect(result.executionSummary).toContain('生成失敗');
  });
});
