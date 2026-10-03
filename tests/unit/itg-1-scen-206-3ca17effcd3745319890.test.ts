import { submitDailyReport, DuplicateSubmissionForDateException, type SubmitDailyReportInput } from '../../src/logic/daily-report-submission';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-206: 同一報告者が同一報告日に既に提出済みの場合、重複提出エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockAuth = require('../../src/logic/user-authentication-authorization');
    const mockValidation = require('../../src/logic/input-validation-formatting');
    const mockBusinessDay = require('../../src/logic/business-day-deadline-judgment');
    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    mockAuth.authenticateAndAuthorizeReporterAccess = jest.fn().mockResolvedValue({ isAccessGranted: true });
    mockValidation.validateDailyReportContent = jest.fn().mockResolvedValue({ isValid: true });
    mockBusinessDay.judgeBusinessDayAndDeadline = jest.fn().mockResolvedValue({ isWithinDeadline: true });
    mockPersistence.checkDailyReportExistsForDate = jest.fn().mockResolvedValue(true);
    mockPersistence.saveDailyReport = jest.fn();
    mockPersistence.updateDailyReportSubmissionTimestamp = jest.fn();
    mockNotification.sendDailyReportSubmissionNotification = jest.fn();
  });

  it('DuplicateSubmissionForDateException が発生して提出が拒否される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-test-001',
      reportDate: '2024-01-15',
      businessContent: '有効な業務内容テキスト',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:00:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DuplicateSubmissionForDateException);
    await expect(submitDailyReport(input)).rejects.toThrow('本日の日報は既に提出済みです。');

    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    expect(mockPersistence.saveDailyReport).not.toHaveBeenCalled();
    expect(mockPersistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(mockNotification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
