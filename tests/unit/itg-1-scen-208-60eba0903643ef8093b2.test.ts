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

describe('SCEN-208: リーダー通知トリガーの発火に失敗した場合、通知エラーが発生するがシステムハンドリングされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.authenticateAndAuthorizeReporterAccess as jest.Mock).mockResolvedValue({ authorized: true });
    (validationModule.validateDailyReportContent as jest.Mock).mockResolvedValue({ valid: true });
    (deadlineModule.judgeBusinessDayAndDeadline as jest.Mock).mockResolvedValue({ status: 'within_deadline' });
    (persistenceModule.checkDailyReportExistsForDate as jest.Mock).mockResolvedValue(false);
    (persistenceModule.saveDailyReport as jest.Mock).mockResolvedValue({ dailyReportId: 'report-001' });
    (persistenceModule.updateDailyReportSubmissionTimestamp as jest.Mock).mockResolvedValue({ updated: true });
    (notificationModule.sendDailyReportSubmissionNotification as jest.Mock).mockRejectedValue(
      new NotificationTriggerFailedException()
    );
  });

  it('通知トリガー失敗時、成功としてハンドリングされる', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aのシステム要件定義会議に出席し、業務フローを確認した',
      achievements: '要件定義ドキュメント初版完成',
      challenges: 'スケジュール遅延のリスク',
      tomorrowPlan: '実装設計着手',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);
    expect(result).toBeDefined();
    expect(result.dailyReportId).toBe('report-001');
  });

  it('notificationTriggered が false で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aのシステム要件定義会議に出席し、業務フローを確認した',
      achievements: '要件定義ドキュメント初版完成',
      challenges: 'スケジュール遅延のリスク',
      tomorrowPlan: '実装設計着手',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.notificationTriggered).toBe(false);
  });

  it('dailyReportId が正常に返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aのシステム要件定義会議に出席し、業務フローを確認した',
      achievements: '要件定義ドキュメント初版完成',
      challenges: 'スケジュール遅延のリスク',
      tomorrowPlan: '実装設計着手',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.dailyReportId).toBe('report-001');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
  });

  it('submissionStatus が within_deadline で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aのシステム要件定義会議に出席し、業務フローを確認した',
      achievements: '要件定義ドキュメント初版完成',
      challenges: 'スケジュール遅延のリスク',
      tomorrowPlan: '実装設計着手',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.submissionStatus).toBe('within_deadline');
  });

  it('completionMessage に値が含まれる', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aのシステム要件定義会議に出席し、業務フローを確認した',
      achievements: '要件定義ドキュメント初版完成',
      challenges: 'スケジュール遅延のリスク',
      tomorrowPlan: '実装設計着手',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.completionMessage).toBeTruthy();
    expect(typeof result.completionMessage).toBe('string');
  });
});
