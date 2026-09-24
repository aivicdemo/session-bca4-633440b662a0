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

describe('SCEN-013: leaderNotificationsSent がリーダーに送信された通知数（提出済み日報ごと）と一致する', () => {
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
      if (['R001', 'R002', 'R003'].includes(input.reporterId)) {
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
        { reporterId: 'R004', reporterName: '報告者4', lastSubmittedDate: new Date('2024-01-14T15:00:00+09:00') },
        { reporterId: 'R005', reporterName: '報告者5', lastSubmittedDate: null },
      ],
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      promptId: `PROMPT-${Date.now()}`,
    });
  });

  it('leaderNotificationsSent が提出済み日報3件に対応する3と一致する', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent(
      {
        executionTimestamp,
        targetDate,
        systemContext,
      },
      mockAiClient
    );

    expect(result.leaderNotificationsSent).toBe(3);
    expect(['success', 'partial_success']).toContain(result.executionStatus);
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);
    expect(result.nonSubmittedReporters.length).toBe(2);
    expect(result.promptsSent).toBe(2);
    expect(result.errors ?? []).toEqual([]);
    expect(result.executionSummary).toMatch(/提出通知|リーダー通知/);
  });
});
