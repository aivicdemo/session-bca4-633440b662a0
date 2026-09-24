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
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderSubmissionNotification: jest.fn(),
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));

import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

class DailyReportGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DailyReportGenerationError';
  }
}
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { submitDailyReport } from '../../src/logic/daily-report-submission';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import {
  sendLeaderSubmissionNotification,
  sendLeaderNonSubmissionPromptNotification,
} from '../../src/logic/daily-report-reminder-notification';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedSubmitDailyReport = submitDailyReport as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;

const REPORTERS = [
  { reporterId: 'R001', userId: 'R001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R002', userId: 'R002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R003', userId: 'R003', reporterName: '報告者3', emailAddress: 'r003@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R004', userId: 'R004', reporterName: '報告者4', emailAddress: 'r004@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R005', userId: 'R005', reporterName: '報告者5', emailAddress: 'r005@example.com', department: '総務部', status: 'active' },
];

// R005の「日報生成」失敗は詳細設計上、submitDailyReportとは別の生成処理として呼び出し関係が定義されていない
// (physical-design.jsonにDailyReportGenerationErrorを発生させる呼び出し先が見当たらない)。
// このテストではsubmitDailyReportがDailyReportGenerationErrorを発生させる構成とした。
// 詳細は .aivic/batches/25/unresolved.md の SCEN-004 の項を参照。

describe('SCEN-004: 日報生成失敗により、その報告者の日報が提出されず生成エラーが記録される', () => {
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
      if (['R001', 'R002', 'R003'].includes(input.userId)) {
        return Promise.resolve({
          dailyReportId: `DR-${input.userId}`,
          userId: input.userId,
          reportDate: '2024-01-15',
          submissionTimestamp: '2024-01-15T17:06:00+09:00',
          submissionStatus: 'submitted',
          notificationTriggered: true,
          completionMessage: '日報を提出しました。',
        });
      }
      if (input.userId === 'R005') {
        return Promise.reject(
          new DailyReportGenerationError('日報の生成に失敗しました。入力内容を確認してください。')
        );
      }
      return Promise.reject(new Error(`unexpected submitDailyReport call for ${input.userId}`));
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [
        { userId: 'R004', userName: '報告者4', emailAddress: 'r004@example.com', promptSent: true },
        { userId: 'R005', userName: '報告者5', emailAddress: 'r005@example.com', promptSent: true },
      ],
      detectionLog: {
        detectedAt: '2024-01-15T17:06:30+09:00',
        targetDate: '2024-01-15',
        checkedReporterCount: 5,
        nonSubmittedCount: 2,
      },
      detectionTimestamp: '2024-01-15T17:06:30+09:00',
    });

    mockedSendLeaderSubmissionNotification.mockImplementation((input: any) =>
      Promise.resolve({
        success: true,
        notificationId: `NOTIF-${input.reporterId}`,
        sentAt: new Date('2024-01-15T17:07:00+09:00'),
        deliveryMethod: 'email',
        errorDetails: null,
      })
    );

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-PROMPT-001',
      sentAt: new Date('2024-01-15T17:08:00+09:00'),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 2,
      errorDetails: null,
    });
  });

  it('R001~R003は提出・通知完了、R004は入力不足、R005は生成失敗として2名へ催促送信される', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    }, mockAiClient);

    expect(result.executionStatus).toBe('partial_success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters.some((r: any) => r.userId === 'R004')).toBe(true);
    expect(result.nonSubmittedReporters.some((r: any) => r.userId === 'R005')).toBe(true);
    expect(result.promptsSent).toBe(2);
    expect(result.leaderNotificationsSent).toBe(3);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        errorCode: 'DailyReportGenerationError',
        errorMessage: '日報の生成に失敗しました。入力内容を確認してください。',
      })
    );
    expect(result.executionSummary).toContain(
      '3名の日報を提出・通知完了。R005の日報生成失敗、R004の入力不足により、2名へ催促メール送信。'
    );
  });
});
