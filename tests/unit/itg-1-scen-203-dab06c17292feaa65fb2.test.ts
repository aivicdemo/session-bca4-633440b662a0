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

import { submitDailyReport, SubmitDailyReportInput, DailyReportContentEmptyException } from '../../src/logic/daily-report-submission';
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

describe('SCEN-203: 業務内容が空白の場合、内容空エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      userId: 'reporter-001',
      isAuthenticated: true,
      isEligibleForSubmission: true,
    });

    mockedValidateDailyReportContent.mockImplementation(() => {
      const error = new DailyReportContentEmptyException('日報内容を入力してください。');
      return Promise.reject(error);
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue({
      exists: false,
    });
  });

  it('should throw DailyReportContentEmptyException when business content is empty', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentEmptyException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報内容を入力してください。');

    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
    expect(mockedValidateDailyReportContent).toHaveBeenCalledTimes(1);
    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalledTimes(0);
    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalledTimes(0);
    expect(mockedSaveDailyReport).toHaveBeenCalledTimes(0);
    expect(mockedUpdateDailyReportSubmissionTimestamp).toHaveBeenCalledTimes(0);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(0);
  });
});
