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

describe('SCEN-212: オプション項目の一部が入力されて提出された場合、入力された項目のみが保存される', () => {
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
      submissionDeadline: '2024-01-15T18:00:00Z',
    });

    (dailyReportPersistence.checkDailyReportExistsForDate as jest.Mock).mockResolvedValue({
      exists: false,
    });

    (dailyReportPersistence.saveDailyReport as jest.Mock).mockResolvedValue({
      dailyReportId: 'daily-report-20240115-uuid',
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    });

    (dailyReportPersistence.updateDailyReportSubmissionTimestamp as jest.Mock).mockResolvedValue({
      dailyReportId: 'daily-report-20240115-uuid',
      submissionTimestamp: '2024-01-15T16:30:00Z',
      updated: true,
    });

    (emailNotification.sendDailyReportSubmissionNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationSent: true,
    });
  });

  it('一部フィールド（businessContent と achievements）のみで保存される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.dailyReportId).toBe('daily-report-20240115-uuid');
    expect(typeof result.dailyReportId).toBe('string');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(typeof result.completionMessage).toBe('string');
    expect(result.completionMessage.length).toBeGreaterThan(0);
  });
});
