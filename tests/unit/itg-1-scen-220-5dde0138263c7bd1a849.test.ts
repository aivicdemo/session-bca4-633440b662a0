import { submitDailyReport, SubmitDailyReportInput, DailyReportContentExceedsMaxLengthException } from '../../src/logic/daily-report-submission';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as deadlineModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as notificationModule from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
}));

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
}));

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
}));

jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
}));

describe('SCEN-220: validateAndRecordDailyReportSubmission throws error when business content exceeds 500 characters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DailyReportContentExceedsMaxLengthException when businessContent exceeds 500 characters', async () => {
    jest.spyOn(userAuthModule, 'authenticateAndAuthorizeReporterAccess').mockResolvedValue({
      isAccessGranted: true,
      userId: 'user001',
    });

    const longContent = 'a'.repeat(501);
    jest.spyOn(validationModule, 'validateDailyReportContent').mockRejectedValue(
      new DailyReportContentExceedsMaxLengthException('日報内容が長すぎます。')
    );

    const input: SubmitDailyReportInput = {
      userId: 'user001',
      reportDate: '2024-01-15',
      businessContent: longContent,
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentExceedsMaxLengthException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報内容が長すぎます。');

    expect(validationModule.validateDailyReportContent).toHaveBeenCalledTimes(1);
    expect(persistenceModule.saveDailyReport).not.toHaveBeenCalled();
    expect(persistenceModule.checkDailyReportExistsForDate).not.toHaveBeenCalled();
    expect(persistenceModule.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(notificationModule.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
