import { submitDailyReport, SubmissionDeadlineExceededException, type SubmitDailyReportInput } from '../../src/logic/daily-report-submission';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-205: 提出時刻が定時期限を超過している場合、期限超過エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockAuth = require('../../src/logic/user-authentication-authorization');
    const mockValidation = require('../../src/logic/input-validation-formatting');
    const mockBusinessDay = require('../../src/logic/business-day-deadline-judgment');
    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    mockAuth.authenticateAndAuthorizeReporterAccess = jest.fn().mockResolvedValue({ isAccessGranted: true });
    mockValidation.validateDailyReportContent = jest.fn().mockResolvedValue({ isValid: true });
    mockBusinessDay.judgeBusinessDayAndDeadline = jest.fn().mockRejectedValue(
      new SubmissionDeadlineExceededException('日報提出期限を超過しています。')
    );
    mockPersistence.checkDailyReportExistsForDate = jest.fn();
    mockPersistence.saveDailyReport = jest.fn();
    mockPersistence.updateDailyReportSubmissionTimestamp = jest.fn();
    mockNotification.sendDailyReportSubmissionNotification = jest.fn();
  });

  it('SubmissionDeadlineExceededException が発生して提出が拒否される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクトの進捗を確認した',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(SubmissionDeadlineExceededException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報提出期限を超過しています。');

    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    expect(mockPersistence.saveDailyReport).not.toHaveBeenCalled();
    expect(mockPersistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(mockNotification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
