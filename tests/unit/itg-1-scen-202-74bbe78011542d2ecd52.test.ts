import { submitDailyReport, ReporterNotEligibleForSubmissionException, type SubmitDailyReportInput } from '../../src/logic/daily-report-submission';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-202: 報告者が提出対象外または無効化されている場合、提出資格なしエラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockAuth = require('../../src/logic/user-authentication-authorization');
    const mockValidation = require('../../src/logic/input-validation-formatting');
    const mockBusinessDay = require('../../src/logic/business-day-deadline-judgment');
    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    mockAuth.authenticateAndAuthorizeReporterAccess = jest.fn().mockRejectedValue(
      new ReporterNotEligibleForSubmissionException('この報告者は日報提出対象外です。')
    );
    mockValidation.validateDailyReportContent = jest.fn();
    mockBusinessDay.judgeBusinessDayAndDeadline = jest.fn();
    mockPersistence.checkDailyReportExistsForDate = jest.fn();
    mockPersistence.saveDailyReport = jest.fn();
    mockPersistence.updateDailyReportSubmissionTimestamp = jest.fn();
    mockNotification.sendDailyReportSubmissionNotification = jest.fn();
  });

  it('ReporterNotEligibleForSubmissionException が発生して提出が拒否される', async () => {
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

    const mockValidation = require('../../src/logic/input-validation-formatting');
    const mockBusinessDay = require('../../src/logic/business-day-deadline-judgment');
    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    expect(mockValidation.validateDailyReportContent).not.toHaveBeenCalled();
    expect(mockBusinessDay.judgeBusinessDayAndDeadline).not.toHaveBeenCalled();
    expect(mockPersistence.checkDailyReportExistsForDate).not.toHaveBeenCalled();
    expect(mockPersistence.saveDailyReport).not.toHaveBeenCalled();
    expect(mockPersistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(mockNotification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
