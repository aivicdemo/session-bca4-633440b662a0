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

describe('SCEN-215: システムが自動記録した提出時刻がレスポンスの submissionTimestamp に含まれる', () => {
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
      dailyReportId: 'report-unique-id',
      userId: 'reporter001',
      reportDate: '2024-01-15',
      submissionTimestamp: '2024-01-15T14:30:15Z',
    });

    (dailyReportPersistence.updateDailyReportSubmissionTimestamp as jest.Mock).mockResolvedValue({
      dailyReportId: 'report-unique-id',
      submissionTimestamp: '2024-01-15T14:30:15Z',
      updated: true,
    });

    (emailNotification.sendDailyReportSubmissionNotification as jest.Mock).mockResolvedValue({
      success: true,
      notificationSent: true,
    });
  });

  it('システム記録したタイムスタンプが submissionTimestamp に含まれる', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.submissionTimestamp).toBe('2024-01-15T14:30:15Z');
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.submissionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.dailyReportId).toBe('report-unique-id');
    expect(result.userId).toBe('reporter001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(typeof result.completionMessage).toBe('string');
    expect(result.completionMessage.length).toBeGreaterThan(0);
  });
});
