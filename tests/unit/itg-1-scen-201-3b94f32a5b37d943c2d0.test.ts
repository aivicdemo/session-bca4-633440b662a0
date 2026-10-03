import { submitDailyReport, ReporterNotAuthenticatedException, type SubmitDailyReportInput } from '../../src/logic/daily-report-submission';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-201: 報告者が未認証またはアカウント無効の場合、認証エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockAuth = require('../../src/logic/user-authentication-authorization');
    const mockValidation = require('../../src/logic/input-validation-formatting');
    const mockBusinessDay = require('../../src/logic/business-day-deadline-judgment');
    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    mockAuth.authenticateAndAuthorizeReporterAccess = jest.fn().mockRejectedValue(
      new ReporterNotAuthenticatedException('報告者の認証に失敗しました。ログインしてください。')
    );
    mockValidation.validateDailyReportContent = jest.fn();
    mockBusinessDay.judgeBusinessDayAndDeadline = jest.fn();
    mockPersistence.checkDailyReportExistsForDate = jest.fn();
    mockPersistence.saveDailyReport = jest.fn();
    mockPersistence.updateDailyReportSubmissionTimestamp = jest.fn();
    mockNotification.sendDailyReportSubmissionNotification = jest.fn();
  });

  it('ReporterNotAuthenticatedException が発生して提出が拒否される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-unauthenticated',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(ReporterNotAuthenticatedException);
    await expect(submitDailyReport(input)).rejects.toThrow('報告者の認証に失敗しました。ログインしてください。');

    const mockValidation = require('../../src/logic/input-validation-formatting');
    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    expect(mockValidation.validateDailyReportContent).not.toHaveBeenCalled();
    expect(mockPersistence.checkDailyReportExistsForDate).not.toHaveBeenCalled();
    expect(mockPersistence.saveDailyReport).not.toHaveBeenCalled();
    expect(mockPersistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(mockNotification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
