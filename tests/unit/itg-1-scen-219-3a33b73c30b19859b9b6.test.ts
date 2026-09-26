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

import { submitDailyReport, SubmitDailyReportInput } from '../../src/logic/daily-report-submission';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';

const mockedValidateDailyReportContent = validateDailyReportContent as jest.MockedFunction<any>;

describe('SCEN-219: 1文字の日報内容に対して警告メッセージが表示される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('1文字の報告内容に対して警告メッセージが返される', async () => {
    // Arrange
    const input: SubmitDailyReportInput = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: 'a',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    // スタブ設定
    mockedValidateDailyReportContent.mockReturnValue({
      isValid: true,
      validatedContent: 'a',
      errorCode: null,
    });

    // Act
    const result = await submitDailyReport(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.completionMessage).toContain('内容が短いようです。詳しく入力してください');
    expect(result.dailyReportId).toBeTruthy();
    expect(result.dailyReportId).not.toBe('');
    expect(typeof result.dailyReportId).toBe('string');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
  });
});
