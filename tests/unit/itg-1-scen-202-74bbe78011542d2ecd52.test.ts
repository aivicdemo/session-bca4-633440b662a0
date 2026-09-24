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

import { submitDailyReport, SubmitDailyReportInput, ReporterNotEligibleForSubmissionException } from '../../src/logic/daily-report-submission';
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

describe('SCEN-202: 報告者が提出対象外または無効化されている場合、提出資格なしエラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(() => {
      const error = new ReporterNotEligibleForSubmissionException('この報告者は日報提出対象外です。');
      return Promise.reject(error);
    });
  });

  it('should throw ReporterNotEligibleForSubmissionException when reporter is not eligible', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(ReporterNotEligibleForSubmissionException);
    await expect(submitDailyReport(input)).rejects.toThrow('この報告者は日報提出対象外です。');

    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
    expect(mockedValidateDailyReportContent).toHaveBeenCalledTimes(0);
    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalledTimes(0);
    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalledTimes(0);
    expect(mockedSaveDailyReport).toHaveBeenCalledTimes(0);
    expect(mockedUpdateDailyReportSubmissionTimestamp).toHaveBeenCalledTimes(0);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(0);
  });
});
