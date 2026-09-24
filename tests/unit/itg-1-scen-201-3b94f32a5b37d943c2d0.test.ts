jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));
jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateDailyReportContent: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  checkDailyReportExistsForDate: jest.fn(),
  saveDailyReport: jest.fn(),
  updateDailyReportSubmissionTimestamp: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import { submitDailyReport, SubmitDailyReportInput, ReporterNotAuthenticatedException } from '../../src/logic/daily-report-submission';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { checkDailyReportExistsForDate, saveDailyReport, updateDailyReportSubmissionTimestamp } from '../../src/logic/daily-report-persistence';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedValidateDailyReportContent = validateDailyReportContent as jest.Mock;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.Mock;
const mockedSaveDailyReport = saveDailyReport as jest.Mock;
const mockedUpdateDailyReportSubmissionTimestamp = updateDailyReportSubmissionTimestamp as jest.Mock;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.Mock;

describe('SCEN-201: 報告者が未認証またはアカウント無効の場合、認証エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(() => {
      const error = new ReporterNotAuthenticatedException('報告者の認証に失敗しました。ログインしてください。');
      return Promise.reject(error);
    });
  });

  it('should throw ReporterNotAuthenticatedException when authentication fails', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-unauthenticated',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(ReporterNotAuthenticatedException);
    await expect(submitDailyReport(input)).rejects.toThrow('報告者の認証に失敗しました。ログインしてください。');

    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
    expect(mockedValidateDailyReportContent).toHaveBeenCalledTimes(0);
    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalledTimes(0);
    expect(mockedSaveDailyReport).toHaveBeenCalledTimes(0);
    expect(mockedUpdateDailyReportSubmissionTimestamp).toHaveBeenCalledTimes(0);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(0);
  });
});
