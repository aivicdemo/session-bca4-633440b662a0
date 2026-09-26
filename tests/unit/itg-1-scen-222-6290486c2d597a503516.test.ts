import { describe, it, expect, beforeEach, jest } from '@jest/globals';

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
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';
import { saveDailyReport, updateDailyReportSubmissionTimestamp } from '../../src/logic/daily-report-persistence';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

const mockedValidateDailyReportContent = validateDailyReportContent as jest.MockedFunction<any>;
const mockedSaveDailyReport = saveDailyReport as jest.MockedFunction<any>;
const mockedUpdateDailyReportSubmissionTimestamp = updateDailyReportSubmissionTimestamp as jest.MockedFunction<any>;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-222: 報告内容が空のときエラーが発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('空の日報内容でDailyReportContentEmptyExceptionがスロー', async () => {
    // Arrange
    const input: SubmitDailyReportInput = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    // スタブ設定
    const exceptionMessage = '日報内容を入力してください。';
    mockedValidateDailyReportContent.mockRejectedValue(
      new DailyReportContentEmptyException(exceptionMessage)
    );

    // Act & Assert
    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentEmptyException);

    // saveDailyReport、updateDailyReportSubmissionTimestamp、
    // sendDailyReportSubmissionNotification が呼び出されていないことを確認
    expect(mockedSaveDailyReport).not.toHaveBeenCalled();
    expect(mockedUpdateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(mockedSendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
