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

import { submitDailyReport, SubmitDailyReportInput, DailyReportContentExceedsMaxLengthException } from '../../src/logic/daily-report-submission';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { checkDailyReportExistsForDate, saveDailyReport, updateDailyReportSubmissionTimestamp } from '../../src/logic/daily-report-persistence';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>;
const mockedValidateDailyReportContent = validateDailyReportContent as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<any>;
const mockedSaveDailyReport = saveDailyReport as jest.MockedFunction<any>;
const mockedUpdateDailyReportSubmissionTimestamp = updateDailyReportSubmissionTimestamp as jest.MockedFunction<any>;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-204: 業務内容が最大文字数を超過している場合、超過エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      userId: 'reporter-001',
      isAuthenticated: true,
      isEligibleForSubmission: true,
    });

    mockedValidateDailyReportContent.mockImplementation(() => {
      const error = new DailyReportContentExceedsMaxLengthException('日報内容が長すぎます。');
      return Promise.reject(error);
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue({
      exists: false,
    });
  });

  it('should throw DailyReportContentExceedsMaxLengthException when business content exceeds max length', async () => {
    const oversizedContent = 'a'.repeat(1001);

    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: oversizedContent,
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentExceedsMaxLengthException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報内容が長すぎます。');

    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
    expect(mockedValidateDailyReportContent).toHaveBeenCalledTimes(1);
    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalledTimes(0);
    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalledTimes(0);
    expect(mockedSaveDailyReport).toHaveBeenCalledTimes(0);
    expect(mockedUpdateDailyReportSubmissionTimestamp).toHaveBeenCalledTimes(0);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(0);
  });
});
