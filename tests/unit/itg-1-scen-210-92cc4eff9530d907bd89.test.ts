import { submitDailyReport, SubmitDailyReportOutput } from '../../src/logic/daily-report-submission';
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

describe('SCEN-210: 提出時刻が期限超過である場合、submissionStatus が after_deadline として返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.authenticateAndAuthorizeReporterAccess as jest.Mock).mockResolvedValue({ authorized: true });
    (validationModule.validateDailyReportContent as jest.Mock).mockResolvedValue({ valid: true });
    (deadlineModule.judgeBusinessDayAndDeadline as jest.Mock).mockResolvedValue({ status: 'after_deadline' });
    (persistenceModule.checkDailyReportExistsForDate as jest.Mock).mockResolvedValue(false);
    (persistenceModule.saveDailyReport as jest.Mock).mockResolvedValue({ dailyReportId: 'report-12345' });
    (persistenceModule.updateDailyReportSubmissionTimestamp as jest.Mock).mockResolvedValue({ updated: true });
    (notificationModule.sendDailyReportSubmissionNotification as jest.Mock).mockResolvedValue({ triggered: true });
  });

  it('提出時刻が期限超過のとき、submissionStatus が after_deadline で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.submissionStatus).toBe('after_deadline');
  });

  it('dailyReportId が report-12345 で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.dailyReportId).toBe('report-12345');
  });

  it('userId が reporter-001 で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.userId).toBe('reporter-001');
  });

  it('reportDate が 2024-01-15 で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.reportDate).toBe('2024-01-15');
  });

  it('submissionTimestamp が 2024-01-15T18:30:00Z で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.submissionTimestamp).toBe('2024-01-15T18:30:00Z');
  });

  it('notificationTriggered が true で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.notificationTriggered).toBe(true);
  });

  it('completionMessage に値が含まれる', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.completionMessage).toBeTruthy();
    expect(typeof result.completionMessage).toBe('string');
  });

  it('エラーが発生しない', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    await expect(submitDailyReport(input)).resolves.toBeDefined();
  });
});
