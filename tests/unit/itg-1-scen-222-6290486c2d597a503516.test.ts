jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  checkDailyReportExistsForDate: jest.fn(),
  saveDailyReport: jest.fn(),
  updateDailyReportSubmissionTimestamp: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderSubmissionNotification: jest.fn(),
}));

import { submitDailyReport, SubmitDailyReportInput, DailyReportContentEmptyException } from '../../src/logic/daily-report-submission';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { checkDailyReportExistsForDate, saveDailyReport, updateDailyReportSubmissionTimestamp } from '../../src/logic/daily-report-persistence';
import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.Mock;
const mockedSaveDailyReport = saveDailyReport as jest.Mock;
const mockedUpdateDailyReportSubmissionTimestamp = updateDailyReportSubmissionTimestamp as jest.Mock;
const mockedSendLeaderSubmissionNotification = sendLeaderSubmissionNotification as jest.Mock;

describe('SCEN-222: 業務ルール recordAndValidateDailyReportSubmission で報告内容が空のときエラーが発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter001',
    });
  });

  it('businessContent が空文字列の場合、DailyReportContentEmptyException がスローされ、後続の処理は実行されない', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentEmptyException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報内容を入力してください。');

    expect(mockedSaveDailyReport).not.toHaveBeenCalled();
    expect(mockedCheckDailyReportExistsForDate).not.toHaveBeenCalled();
    expect(mockedUpdateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(mockedSendLeaderSubmissionNotification).not.toHaveBeenCalled();
  });
});
