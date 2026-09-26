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

import { submitDailyReport, SubmitDailyReportInput } from '../../src/logic/daily-report-submission';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { checkDailyReportExistsForDate, saveDailyReport } from '../../src/logic/daily-report-persistence';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>;
const mockedValidateDailyReportContent = validateDailyReportContent as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.MockedFunction<any>;
const mockedSaveDailyReport = saveDailyReport as jest.MockedFunction<any>;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-221: 送信時刻記録・重複確認・送信完了判定を実行する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('正常系: 日報が提出され、すべての処理が実行される', async () => {
    // Arrange
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    // スタブ設定
    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
    });

    mockedValidateDailyReportContent.mockResolvedValue({
      isValid: true,
      validatedContent: input.businessContent,
      errorCode: null,
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue(false);

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T18:00:00Z',
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    mockedSaveDailyReport.mockResolvedValue({
      dailyReportId: 'daily-report-20240115-001',
      savedAt: '2024-01-15T14:30:00Z',
      userId: 'reporter-001',
      reportDate: '2024-01-15',
    });

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'email-001',
      sentAt: '2024-01-15T14:30:10Z',
      errorMessage: null,
      adminNotificationSent: false,
    });

    // Act
    const result = await submitDailyReport(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.dailyReportId).toBeTruthy();
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T14:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toContain('日報が正常に提出されました');

    // 処理が実行されたことを検証
    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalled();
    expect(mockedValidateDailyReportContent).toHaveBeenCalled();
    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalled();
    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalled();
    expect(mockedSaveDailyReport).toHaveBeenCalled();
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalled();
  });
});
