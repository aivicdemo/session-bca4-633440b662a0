import { submitDailyReport, PersistenceDailyReportFailedException } from '../../src/logic/daily-report-submission';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as deadlineModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as notificationModule from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-207: 日報レコードの保存に失敗した場合、永続化エラーが発生して提出が失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({ authorized: true });
    (validationModule.validateDailyReportContent as jest.MockedFunction<any>).mockResolvedValue({ valid: true });
    (deadlineModule.judgeBusinessDayAndDeadline as jest.MockedFunction<any>).mockResolvedValue({ status: 'within_deadline' });
    (persistenceModule.checkDailyReportExistsForDate as jest.MockedFunction<any>).mockResolvedValue(false);
    (persistenceModule.saveDailyReport as jest.MockedFunction<any>).mockRejectedValue(
      new PersistenceDailyReportFailedException('日報の保存に失敗しました。')
    );
  });

  it('日報保存に失敗した場合、PersistenceDailyReportFailedException が発生する', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(PersistenceDailyReportFailedException);
  });

  it('エラーメッセージが「日報の保存に失敗しました。」と一致する', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    try {
      await submitDailyReport(input);
      fail('should have thrown PersistenceDailyReportFailedException');
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceDailyReportFailedException);
      expect((error as Error).message).toBe('日報の保存に失敗しました。');
    }
  });

  it('永続化失敗時に sendDailyReportSubmissionNotification は呼び出されない', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch {}

    expect(notificationModule.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });

  it('永続化失敗時に updateDailyReportSubmissionTimestamp は呼び出されない', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch {}

    expect(persistenceModule.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
  });
});
