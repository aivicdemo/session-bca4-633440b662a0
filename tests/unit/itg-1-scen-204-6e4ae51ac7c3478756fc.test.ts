import { submitDailyReport, DailyReportContentExceedsMaxLengthException, type SubmitDailyReportInput } from '../../src/logic/daily-report-submission';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-204: 業務内容が最大文字数を超過している場合、超過エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockAuth = require('../../src/logic/user-authentication-authorization');
    const mockValidation = require('../../src/logic/input-validation-formatting');
    const mockBusinessDay = require('../../src/logic/business-day-deadline-judgment');
    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    mockAuth.authenticateAndAuthorizeReporterAccess = jest.fn().mockResolvedValue({ isAccessGranted: true });
    mockValidation.validateDailyReportContent = jest.fn().mockRejectedValue(
      new DailyReportContentExceedsMaxLengthException('日報内容が長すぎます。')
    );
    mockBusinessDay.judgeBusinessDayAndDeadline = jest.fn();
    mockPersistence.checkDailyReportExistsForDate = jest.fn();
    mockPersistence.saveDailyReport = jest.fn();
    mockPersistence.updateDailyReportSubmissionTimestamp = jest.fn();
    mockNotification.sendDailyReportSubmissionNotification = jest.fn();
  });

  it('DailyReportContentExceedsMaxLengthException が発生して提出が拒否される', async () => {
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

    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    expect(mockPersistence.saveDailyReport).not.toHaveBeenCalled();
    expect(mockPersistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(mockNotification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
