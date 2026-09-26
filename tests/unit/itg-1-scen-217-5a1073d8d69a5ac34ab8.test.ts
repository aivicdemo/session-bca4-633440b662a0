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

import { submitDailyReport, type SubmitDailyReportOutput } from '../../src/logic/daily-report-submission';
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

describe('SCEN-217: 業務ルール validateAndRecordDailyReportSubmission が送信時刻記録と期限判定を実行する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
      denialReason: null,
    });

    mockedValidateDailyReportContent.mockResolvedValue({
      isValid: true,
      validatedContent: '本日はシステムテストを実施した',
      errorCode: null,
    });

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue(false);

    mockedSaveDailyReport.mockResolvedValue({
      dailyReportId: 'daily-report-uuid-12345',
      savedAt: '2024-01-15T16:30:00Z',
      userId: 'reporter-001',
      reportDate: '2024-01-15',
    });

    mockedUpdateDailyReportSubmissionTimestamp.mockResolvedValue({
      dailyReportId: 'daily-report-uuid-12345',
      previousSubmittedAt: null,
      updatedSubmittedAt: '2024-01-15T16:30:00Z',
      updatedAt: '2024-01-15T16:30:00Z',
    });

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'notif-001',
      sentAt: '2024-01-15T16:30:00Z',
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  it('報告内容が有効で期限内の場合、日報が提出され、ステータスと通知が正常に返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日はシステムテストを実施した',
      achievements: 'テストケース50件の実装完了',
      challenges: '環境構築に2時間要した',
      tomorrowPlan: 'システム統合テスト',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.dailyReportId).toBe('daily-report-uuid-12345');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toBeTruthy();

    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
    expect(mockedValidateDailyReportContent).toHaveBeenCalledTimes(1);
    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalledTimes(1);
    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalledTimes(1);
    expect(mockedSaveDailyReport).toHaveBeenCalledTimes(1);
    expect(mockedUpdateDailyReportSubmissionTimestamp).toHaveBeenCalledTimes(1);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
  });
});
