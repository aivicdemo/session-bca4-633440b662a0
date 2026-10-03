import { submitDailyReport, SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-submission';
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

describe('SCEN-219: validateAndRecordDailyReportSubmission displays warning message when business content is 1 character', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success with warning message when businessContent has 1 character', async () => {
    jest.spyOn(userAuthModule, 'authenticateAndAuthorizeReporterAccess').mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter001',
    });
    jest.spyOn(validationModule, 'validateDailyReportContent').mockResolvedValue({
      isValid: true,
      validatedContent: 'a',
      errorCode: null,
    });
    jest.spyOn(deadlineModule, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2025-01-15T17:00:00Z',
      processingPolicy: 'accept',
      rejectionReason: null,
    });
    jest.spyOn(persistenceModule, 'checkDailyReportExistsForDate').mockResolvedValue(false);
    jest.spyOn(persistenceModule, 'saveDailyReport').mockResolvedValue({
      dailyReportId: 'DR-2025-01-15-001',
      savedAt: '2025-01-15T14:30:00Z',
      userId: 'reporter001',
      reportDate: '2025-01-15',
    });
    jest.spyOn(persistenceModule, 'updateDailyReportSubmissionTimestamp').mockResolvedValue({
      dailyReportId: 'DR-2025-01-15-001',
      previousSubmittedAt: '',
      updatedSubmittedAt: '2025-01-15T14:30:00Z',
      updatedAt: '2025-01-15T14:30:00Z',
    });
    jest.spyOn(notificationModule, 'sendDailyReportSubmissionNotification').mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-001',
      sentAt: '2025-01-15T14:30:00Z',
      errorMessage: null,
      adminNotificationSent: false,
    });

    const input: SubmitDailyReportInput = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: 'a',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(result.dailyReportId).toBeTruthy();
    expect(result.dailyReportId).not.toBe('');
    expect(typeof result.dailyReportId).toBe('string');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);

    expect(validationModule.validateDailyReportContent).toHaveBeenCalledWith(
      expect.objectContaining({ businessContent: 'a' })
    );
    expect(validationModule.validateDailyReportContent).toHaveBeenCalledTimes(1);
  });
});
