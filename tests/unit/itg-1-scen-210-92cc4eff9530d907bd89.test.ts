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

describe('SCEN-210: 提出時刻が期限超過である場合、submissionStatus が after_deadline として返される', () => {
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
      submissionStatus: 'after_deadline',
      submissionDeadline: '2024-01-15T17:00:00Z',
    });

    (dailyReportPersistence.checkDailyReportExistsForDate as jest.Mock).mockResolvedValue({
      exists: false,
    });

    (dailyReportPersistence.saveDailyReport as jest.Mock).mockResolvedValue({
      dailyReportId: 'report-12345',
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    });

    (dailyReportPersistence.updateDailyReportSubmissionTimestamp as jest.Mock).mockResolvedValue({
      dailyReportId: 'report-12345',
      submissionTimestamp: '2024-01-15T18:30:00Z',
      updated: true,
    });

    (emailNotification.sendDailyReportSubmissionNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationSent: true,
    });
  });

  it('期限超過時に after_deadline が返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.submissionStatus).toBe('after_deadline');
    expect(result.dailyReportId).toBe('report-12345');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T18:30:00Z');
    expect(result.notificationTriggered).toBe(true);
    expect(typeof result.completionMessage).toBe('string');
    expect(result.completionMessage.length).toBeGreaterThan(0);
  });
});
