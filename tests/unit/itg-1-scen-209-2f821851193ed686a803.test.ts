import { submitDailyReport } from '../../src/logic/daily-report-submission';
import * as userAuth from '../../src/logic/user-authentication-authorization';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as businessDayDeadline from '../../src/logic/business-day-deadline-judgment';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as emailNotification from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateDailyReportContent: jest.fn(),
}));

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  judgeBusinessDayAndDeadline: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  checkDailyReportExistsForDate: jest.fn(),
  saveDailyReport: jest.fn(),
  updateDailyReportSubmissionTimestamp: jest.fn(),
}));

jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendDailyReportSubmissionNotification: jest.fn(),
}));

describe('SCEN-209: 提出時刻が期限内である場合、submissionStatus が within_deadline として返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (userAuth.authenticateAndAuthorizeReporterAccess as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isAuthorized: true,
    });

    (inputValidation.validateDailyReportContent as jest.Mock).mockResolvedValue({
      isValid: true,
      validationStatus: 'valid',
      errorMessage: null,
    });

    (businessDayDeadline.judgeBusinessDayAndDeadline as jest.Mock).mockResolvedValue({
      isBusinessDay: true,
      submissionStatus: 'within_deadline',
      submissionDeadline: '2024-01-15T17:00:00Z',
    });

    (dailyReportPersistence.checkDailyReportExistsForDate as jest.Mock).mockResolvedValue({
      exists: false,
    });

    (dailyReportPersistence.saveDailyReport as jest.Mock).mockResolvedValue({
      dailyReportId: 'daily-report-20240115-001',
      userId: 'reporter001',
      reportDate: '2024-01-15',
      submissionTimestamp: '2024-01-15T16:59:00Z',
    });

    (dailyReportPersistence.updateDailyReportSubmissionTimestamp as jest.Mock).mockResolvedValue({
      dailyReportId: 'daily-report-20240115-001',
      submissionTimestamp: '2024-01-15T16:59:00Z',
      updated: true,
    });

    (emailNotification.sendDailyReportSubmissionNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationSent: true,
    });
  });

  it('submissionStatus が within_deadline として返される', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日のタスクを完了した',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:59:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.submissionStatus).toBe('within_deadline');
    expect(typeof result.dailyReportId).toBe('string');
    expect(result.dailyReportId).toBeTruthy();
    expect(result.userId).toBe('reporter001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T16:59:00Z');
    expect(result.notificationTriggered).toBe(true);
    expect(typeof result.completionMessage).toBe('string');
    expect(result.completionMessage.length).toBeGreaterThan(0);
  });
});
