jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  checkDailyReportExistsForDate: jest.fn(),
  saveDailyReport: jest.fn(),
  updateDailyReportSubmissionTimestamp: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderSubmissionNotification: jest.fn(),
}));

import { submitDailyReport, SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-submission';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { checkDailyReportExistsForDate, saveDailyReport, updateDailyReportSubmissionTimestamp } from '../../src/logic/daily-report-persistence';
import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.Mock;
const mockedSaveDailyReport = saveDailyReport as jest.Mock;
const mockedUpdateDailyReportSubmissionTimestamp = updateDailyReportSubmissionTimestamp as jest.Mock;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.Mock;

describe('SCEN-217: 業務ルール validateAndRecordDailyReportSubmission が送信時刻記録と期限判定を実行する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
    });

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      submissionStatus: 'within_deadline',
      isBusinessDay: true,
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue({
      exists: false,
    });

    mockedSaveDailyReport.mockResolvedValue({
      dailyReportId: 'daily-report-uuid-12345',
      submissionTimestamp: '2024-01-15T16:30:00Z',
      submissionStatus: 'within_deadline',
    });

    mockedUpdateDailyReportSubmissionTimestamp.mockResolvedValue({
      submissionTimestamp: '2024-01-15T16:30:00Z',
    });

    mockedSendLeaderSubmissionNotification.mockResolvedValue({
      notificationTriggered: true,
    });
  });

  it('報告内容が有効で期限内の場合、日報が提出され、ステータスと通知が正常に返される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日はシステムテストを実施した',
      achievements: 'テストケース50件の実装完了',
      challenges: '環境構築に2時間要した',
      tomorrowPlan: 'システム統合テスト',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(result.dailyReportId).toBe('daily-report-uuid-12345');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toBe('日報を提出しました。リーダーに通知します。');

    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledWith({
      userId: 'reporter-001',
    });
    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalledWith({
      submissionTimestamp: '2024-01-15T16:30:00Z',
    });
    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalledWith({
      userId: 'reporter-001',
      reportDate: '2024-01-15',
    });
    expect(mockedSaveDailyReport).toHaveBeenCalled();
    expect(mockedSendLeaderSubmissionNotification).toHaveBeenCalled();
  });
});
