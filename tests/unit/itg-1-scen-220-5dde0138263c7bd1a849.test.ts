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
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import { submitDailyReport, SubmitDailyReportInput, DailyReportContentExceedsMaxLengthException } from '../../src/logic/daily-report-submission';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

const mockedValidateDailyReportContent = validateDailyReportContent as jest.MockedFunction<any>;

describe('SCEN-220: 報告内容が500文字を超える場合に制限される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('501文字のビジネスコンテンツでDailyReportContentExceedsMaxLengthExceptionがスロー', async () => {
    // Arrange
    const oversizeContent = 'a'.repeat(501);
    const input: SubmitDailyReportInput = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: oversizeContent,
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    // スタブ設定
    const exceptionMessage = '日報内容が長すぎます。';
    mockedValidateDailyReportContent.mockImplementation(() => {
      throw new DailyReportContentExceedsMaxLengthException(exceptionMessage);
    });

    // Act & Assert
    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentExceedsMaxLengthException);
  });
});
