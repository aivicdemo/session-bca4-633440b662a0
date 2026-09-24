import { submitDailyReport, NotificationTriggerFailedException, SubmitDailyReportOutput } from '../../src/logic/daily-report-submission';
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

describe('SCEN-214: リーダー通知の発火に失敗した場合、notificationTriggered が false で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.authenticateAndAuthorizeReporterAccess as jest.Mock).mockResolvedValue({ authorized: true });
    (validationModule.validateDailyReportContent as jest.Mock).mockResolvedValue({ valid: true });
    (deadlineModule.judgeBusinessDayAndDeadline as jest.Mock).mockResolvedValue({ status: 'within_deadline' });
    (persistenceModule.checkDailyReportExistsForDate as jest.Mock).mockResolvedValue(false);
    (persistenceModule.saveDailyReport as jest.Mock).mockResolvedValue({ 
      dailyReportId: 'report-20240115-001'
    });
    (persistenceModule.updateDailyReportSubmissionTimestamp as jest.Mock).mockResolvedValue({ updated: true });
    (notificationModule.sendDailyReportSubmissionNotification as jest.Mock).mockRejectedValue(
      new NotificationTriggerFailedException()
    );
  });

  it('通知トリガー失敗時、例外が発生することなく処理が続行される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await expect(submitDailyReport(input)).resolves.toBeDefined();
  });

  it('notificationTriggered が false で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.notificationTriggered).toBe(false);
  });

  it('dailyReportId が report-20240115-001 で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.dailyReportId).toBe('report-20240115-001');
  });

  it('userId が reporter-001 で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.userId).toBe('reporter-001');
  });

  it('reportDate が 2024-01-15 で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.reportDate).toBe('2024-01-15');
  });

  it('submissionTimestamp が 2024-01-15T16:30:00Z で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
  });

  it('submissionStatus が within_deadline で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.submissionStatus).toBe('within_deadline');
  });

  it('completionMessage が返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.completionMessage).toBeTruthy();
    expect(typeof result.completionMessage).toBe('string');
  });

  it('日報レコードは永続化されている', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);
    expect(persistenceModule.saveDailyReport).toHaveBeenCalled();
    expect(persistenceModule.updateDailyReportSubmissionTimestamp).toHaveBeenCalled();
  });
});
