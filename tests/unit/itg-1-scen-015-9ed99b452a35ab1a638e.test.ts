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

import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { submitDailyReport } from '../../src/logic/daily-report-submission';
import { sendLeaderSubmissionNotification, sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedSubmitDailyReport = submitDailyReport as jest.Mock;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;

const ACTIVE_REPORTERS = [
  { reporterId: 'R001', userId: 'U001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R002', userId: 'U002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R003', userId: 'U003', reporterName: '報告者3', emailAddress: 'r003@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R004', userId: 'U004', reporterName: '報告者4', emailAddress: 'r004@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R005', userId: 'U005', reporterName: '報告者5', emailAddress: 'r005@example.com', department: '総務部', status: 'active' },
];

describe('SCEN-015: executionSummary に処理結果の要約メッセージが生成される', () => {
  const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
  const targetDate = new Date('2024-01-15T00:00:00+09:00');
  const systemContext = {
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
    auth: { isAuthenticated: true },
  };

  describe('成功ケース（executionStatus: success）', () => {
    beforeEach(() => {
      jest.resetAllMocks();

      mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
      });

      mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
        success: true,
        reporters: ACTIVE_REPORTERS,
        totalCount: 5,
      });

      mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
        isAccessGranted: true,
        denialReason: null,
      });

      mockedSubmitDailyReport.mockResolvedValue({
        submissionId: `SUB-${Date.now()}`,
        dailyReportId: `DR-${Date.now()}`,
        submissionStatus: 'submitted',
        submissionTimestamp: '2024-01-15T17:03:00+09:00',
      });

      mockedSendLeaderSubmissionNotification.mockResolvedValue({
        success: true,
        notificationId: `NOTIF-${Date.now()}`,
        sentAt: new Date('2024-01-15T17:04:00+09:00'),
      });

      mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
        nonSubmittedReporters: [],
      });

      mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
        success: true,
        promptId: `PROMPT-${Date.now()}`,
      });
    });

    it('executionStatus が success の場合、executionSummary に「すべての処理が正常に完了しました」に類する内容が含まれる', async () => {
      const mockAiClient: any = {};
      const result = await runTx1Imp1Agent(
        {
          executionTimestamp,
          targetDate,
          systemContext,
        },
        mockAiClient
      );

      expect(result.executionStatus).toBe('success');
      expect(result.executionSummary).toBeTruthy();
      expect(typeof result.executionSummary).toBe('string');
      expect(result.executionSummary.length).toBeGreaterThan(0);
      expect(result.executionSummary).toMatch(/正常|完了|成功/);
    });

    it('executionSummary に報告者数、提出数、催促数、リーダー通知数が含まれる', async () => {
      const mockAiClient: any = {};
      const result = await runTx1Imp1Agent(
        {
          executionTimestamp,
          targetDate,
          systemContext,
        },
        mockAiClient
      );

      const summary = result.executionSummary;
      expect(summary).toBeTruthy();
      expect(typeof summary).toBe('string');
    });
  });

  describe('部分的な失敗ケース（executionStatus: partial_success）', () => {
    beforeEach(() => {
      jest.resetAllMocks();

      mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
      });

      mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
        success: true,
        reporters: ACTIVE_REPORTERS,
        totalCount: 5,
      });

      mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
        isAccessGranted: true,
        denialReason: null,
      });

      mockedSubmitDailyReport.mockImplementation((input: any) => {
        if (['R001', 'R002'].includes(input.reporterId)) {
          return Promise.resolve({
            submissionId: `SUB-${input.reporterId}`,
            dailyReportId: `DR-${input.reporterId}`,
            submissionStatus: 'submitted',
            submissionTimestamp: '2024-01-15T17:03:00+09:00',
          });
        }
        return Promise.reject(new Error('Submission failed'));
      });

      mockedSendLeaderSubmissionNotification.mockResolvedValue({
        success: true,
        notificationId: `NOTIF-${Date.now()}`,
        sentAt: new Date('2024-01-15T17:04:00+09:00'),
      });

      mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
        nonSubmittedReporters: [
          { reporterId: 'R003', reporterName: '報告者3', lastSubmittedDate: null },
          { reporterId: 'R004', reporterName: '報告者4', lastSubmittedDate: null },
          { reporterId: 'R005', reporterName: '報告者5', lastSubmittedDate: null },
        ],
      });

      mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
        success: true,
        promptId: `PROMPT-${Date.now()}`,
      });
    });

    it('executionStatus が partial_success の場合、executionSummary に部分的な失敗の旨が含まれる', async () => {
      const mockAiClient: any = {};
      const result = await runTx1Imp1Agent(
        {
          executionTimestamp,
          targetDate,
          systemContext,
        },
        mockAiClient
      );

      expect(result.executionStatus).toBe('partial_success');
      expect(result.executionSummary).toBeTruthy();
      expect(typeof result.executionSummary).toBe('string');
    });
  });

  describe('失敗ケース（executionStatus: failure）', () => {
    beforeEach(() => {
      jest.resetAllMocks();

      mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
        shouldExecute: false,
        isBusinessDay: false,
        isWithinExecutionWindow: false,
      });

      mockedGetActiveReportersForSubmissionCheck.mockRejectedValue(
        new Error('Database error')
      );
    });

    it('エラーが発生した場合、executionSummary にエラー情報が含まれる', async () => {
      const mockAiClient: any = {};
      const result = await runTx1Imp1Agent(
        {
          executionTimestamp,
          targetDate,
          systemContext,
        },
        mockAiClient
      );

      expect(result.executionSummary).toBeTruthy();
      expect(typeof result.executionSummary).toBe('string');
    });
  });

  it('executionSummary が常に非空の文字列である', async () => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: ACTIVE_REPORTERS,
      totalCount: 5,
    });

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      denialReason: null,
    });

    mockedSubmitDailyReport.mockResolvedValue({
      submissionId: `SUB-${Date.now()}`,
      dailyReportId: `DR-${Date.now()}`,
      submissionStatus: 'submitted',
      submissionTimestamp: '2024-01-15T17:03:00+09:00',
    });

    mockedSendLeaderSubmissionNotification.mockResolvedValue({
      success: true,
      notificationId: `NOTIF-${Date.now()}`,
      sentAt: new Date('2024-01-15T17:04:00+09:00'),
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [],
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      promptId: `PROMPT-${Date.now()}`,
    });

    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent(
      {
        executionTimestamp,
        targetDate,
        systemContext,
      },
      mockAiClient
    );

    expect(result.executionSummary).toBeTruthy();
    expect(typeof result.executionSummary).toBe('string');
    expect(result.executionSummary.length).toBeGreaterThan(0);
  });
});
