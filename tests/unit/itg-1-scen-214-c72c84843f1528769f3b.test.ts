import { submitDailyReport, NotificationTriggerFailedException } from '../../src/logic/daily-report-submission';
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

describe('SCEN-214: リーダー通知の発火に失敗した場合、notificationTriggered が false で返される', () => {
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
      dailyReportId: 'report-20240115-001',
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    });

    (dailyReportPersistence.updateDailyReportSubmissionTimestamp as jest.Mock).mockResolvedValue({
      dailyReportId: 'report-20240115-001',
      submissionTimestamp: '2024-01-15T16:30:00Z',
      updated: true,
    });

    (emailNotification.sendDailyReportSubmissionNotification as jest.Mock).mockRejectedValue(
      new NotificationTriggerFailedException('リーダー通知トリガー失敗')
    );
  });

  it('通知失敗時に notificationTriggered=false で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.notificationTriggered).toBe(false);
    expect(result.dailyReportId).toBe('report-20240115-001');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(typeof result.completionMessage).toBe('string');
  });
});
