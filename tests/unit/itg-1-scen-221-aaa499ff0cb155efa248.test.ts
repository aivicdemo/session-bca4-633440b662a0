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

describe('SCEN-221: recordAndValidateDailyReportSubmission executes submission timestamp recording, duplicate confirmation, and completion judgment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute complete submission flow with all validations and process steps', async () => {
    jest.spyOn(userAuthModule, 'authenticateAndAuthorizeReporterAccess').mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
    });
    jest.spyOn(validationModule, 'validateDailyReportContent').mockResolvedValue({
      isValid: true,
      validatedContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      errorCode: null,
    });
    jest.spyOn(deadlineModule, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      processingPolicy: 'accept',
      rejectionReason: null,
    });
    jest.spyOn(persistenceModule, 'checkDailyReportExistsForDate').mockResolvedValue(false);
    jest.spyOn(persistenceModule, 'saveDailyReport').mockResolvedValue({
      dailyReportId: 'daily-report-20240115-001',
      savedAt: '2024-01-15T14:30:00Z',
      userId: 'reporter-001',
      reportDate: '2024-01-15',
    });
    jest.spyOn(persistenceModule, 'updateDailyReportSubmissionTimestamp').mockResolvedValue({
      dailyReportId: 'daily-report-20240115-001',
      previousSubmittedAt: '',
      updatedSubmittedAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
    });
    jest.spyOn(notificationModule, 'sendDailyReportSubmissionNotification').mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-001',
      sentAt: '2024-01-15T14:30:00Z',
      errorMessage: null,
      adminNotificationSent: false,
    });

    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(result.dailyReportId).toBe('daily-report-20240115-001');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T14:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);

    expect(userAuthModule.authenticateAndAuthorizeReporterAccess).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'reporter-001' })
    );
    expect(userAuthModule.authenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);

    expect(validationModule.validateDailyReportContent).toHaveBeenCalledWith(
      expect.objectContaining({ businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。' })
    );
    expect(validationModule.validateDailyReportContent).toHaveBeenCalledTimes(1);

    expect(persistenceModule.checkDailyReportExistsForDate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'reporter-001', reportDate: '2024-01-15' })
    );
    expect(persistenceModule.checkDailyReportExistsForDate).toHaveBeenCalledTimes(1);

    expect(deadlineModule.judgeBusinessDayAndDeadline).toHaveBeenCalledWith(
      expect.objectContaining({ submissionTimestamp: '2024-01-15T14:30:00Z' })
    );
    expect(deadlineModule.judgeBusinessDayAndDeadline).toHaveBeenCalledTimes(1);

    expect(persistenceModule.saveDailyReport).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'reporter-001',
        reportDate: '2024-01-15',
        businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
        achievements: '要件定義書初版の作成完了',
        submissionTimestamp: '2024-01-15T14:30:00Z',
      })
    );
    expect(persistenceModule.saveDailyReport).toHaveBeenCalledTimes(1);

    expect(notificationModule.sendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
  });
});
