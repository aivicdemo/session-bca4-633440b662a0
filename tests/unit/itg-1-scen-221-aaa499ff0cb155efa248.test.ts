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

describe('SCEN-221: 業務ルール recordAndValidateDailyReportSubmission が送信時刻記録・重複確認・送信完了判定を実行する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue({
      exists: false,
    });

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      submissionStatus: 'within_deadline',
      isBusinessDay: true,
    });

    mockedSaveDailyReport.mockResolvedValue({
      dailyReportId: 'daily-report-20240115-001',
      submissionTimestamp: '2024-01-15T14:30:00Z',
      submissionStatus: 'within_deadline',
    });

    mockedSendLeaderSubmissionNotification.mockResolvedValue({
      notificationTriggered: true,
    });
  });

  it('すべての前提条件を満たした場合、日報が記録され、完了メッセージが返される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(result.dailyReportId).toBe('daily-report-20240115-001');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T14:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toBe('日報が正常に提出されました。');

    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledWith({
      userId: 'reporter-001',
    });
    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalledWith({
      userId: 'reporter-001',
      reportDate: '2024-01-15',
    });
    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalledWith({
      submissionTimestamp: '2024-01-15T14:30:00Z',
    });
    expect(mockedSaveDailyReport).toHaveBeenCalled();
    expect(mockedSendLeaderSubmissionNotification).toHaveBeenCalled();
  });
});
