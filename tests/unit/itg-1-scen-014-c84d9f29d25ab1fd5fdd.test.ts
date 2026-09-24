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
  { reporterId: 'R001', userId: 'U001', reporterName: '山田太郎', emailAddress: 'r001@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R002', userId: 'U002', reporterName: '佐藤花子', emailAddress: 'r002@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R003', userId: 'U003', reporterName: '鈴木次郎', emailAddress: 'r003@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R004', userId: 'U004', reporterName: '報告者4', emailAddress: 'r004@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R005', userId: 'U005', reporterName: '報告者5', emailAddress: 'r005@example.com', department: '総務部', status: 'active' },
];

describe('SCEN-014: nonSubmittedReporters に含まれる報告者の lastSubmittedDate が正確に記録される', () => {
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

    mockedSubmitDailyReport.mockImplementation(() =>
      Promise.resolve({
        submissionId: `SUB-${Date.now()}`,
        dailyReportId: `DR-${Date.now()}`,
        submissionStatus: 'submitted',
        submissionTimestamp: '2024-01-15T17:03:00+09:00',
      })
    );

    mockedSendLeaderSubmissionNotification.mockResolvedValue({
      success: true,
      notificationId: `NOTIF-${Date.now()}`,
      sentAt: new Date('2024-01-15T17:04:00+09:00'),
    });

    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      nonSubmittedReporters: [
        {
          reporterId: 'R001',
          reporterName: '山田太郎',
          lastSubmittedDate: new Date('2024-01-12T15:30:00+09:00'),
        },
        {
          reporterId: 'R002',
          reporterName: '佐藤花子',
          lastSubmittedDate: new Date('2024-01-10T14:15:00+09:00'),
        },
        {
          reporterId: 'R003',
          reporterName: '鈴木次郎',
          lastSubmittedDate: null,
        },
      ],
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      promptId: `PROMPT-${Date.now()}`,
    });
  });

  it('nonSubmittedReporters に含まれる報告者の lastSubmittedDate が正確に記録される', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent(
      {
        executionTimestamp,
        targetDate,
        systemContext,
      },
      mockAiClient
    );

    expect(result.executionStatus).toMatch(/success|partial_success/);
    expect(result.nonSubmittedReporters).toHaveLength(3);

    const r001 = result.nonSubmittedReporters.find((r: any) => r.reporterId === 'R001');
    expect(r001).toBeDefined();
    expect(r001.lastSubmittedDate).toEqual(new Date('2024-01-12T15:30:00+09:00'));

    const r002 = result.nonSubmittedReporters.find((r: any) => r.reporterId === 'R002');
    expect(r002).toBeDefined();
    expect(r002.lastSubmittedDate).toEqual(new Date('2024-01-10T14:15:00+09:00'));

    const r003 = result.nonSubmittedReporters.find((r: any) => r.reporterId === 'R003');
    expect(r003).toBeDefined();
    expect(r003.lastSubmittedDate).toBeNull();

    result.nonSubmittedReporters.forEach((r: any) => {
      expect(r).toHaveProperty('reporterId');
      expect(r).toHaveProperty('reporterName');
      expect(r).toHaveProperty('lastSubmittedDate');
    });
  });
});
