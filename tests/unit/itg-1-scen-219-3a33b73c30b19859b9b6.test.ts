jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  checkDailyReportExistsForDate: jest.fn(),
  saveDailyReport: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderSubmissionNotification: jest.fn(),
}));

import { submitDailyReport, SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-submission';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { checkDailyReportExistsForDate, saveDailyReport } from '../../src/logic/daily-report-persistence';
import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.Mock;
const mockedSaveDailyReport = saveDailyReport as jest.Mock;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.Mock;

describe('SCEN-219: 業務ルール validateAndRecordDailyReportSubmission で報告内容が1文字のとき警告メッセージが表示される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter001',
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue({
      exists: false,
    });

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      submissionStatus: 'within_deadline',
      isBusinessDay: true,
    });

    mockedSaveDailyReport.mockResolvedValue({
      dailyReportId: 'daily-report-20250115-001',
      submissionTimestamp: '2025-01-15T14:30:00Z',
      submissionStatus: 'within_deadline',
    });

    mockedSendLeaderSubmissionNotification.mockResolvedValue({
      notificationTriggered: true,
    });
  });

  it('報告内容が1文字の場合、警告メッセージを含むメッセージが返される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: 'a',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(result).toBeDefined();
    expect(typeof result.dailyReportId).toBe('string');
    expect(result.dailyReportId).not.toBe('');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toContain('内容が短いようです。詳しく入力してください');
  });
});
