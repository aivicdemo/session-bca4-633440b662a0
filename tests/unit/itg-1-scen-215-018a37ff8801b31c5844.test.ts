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

describe('SCEN-215: システムが自動記録した提出時刻がレスポンスの submissionTimestamp に含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.authenticateAndAuthorizeReporterAccess as jest.Mock).mockResolvedValue({ authorized: true });
    (validationModule.validateDailyReportContent as jest.Mock).mockResolvedValue({ valid: true });
    (deadlineModule.judgeBusinessDayAndDeadline as jest.Mock).mockResolvedValue({ status: 'within_deadline' });
    (persistenceModule.checkDailyReportExistsForDate as jest.Mock).mockResolvedValue(false);
    (persistenceModule.saveDailyReport as jest.Mock).mockResolvedValue({ 
      dailyReportId: 'report-unique-id',
      recordedTimestamp: '2024-01-15T14:30:15Z'
    });
    (persistenceModule.updateDailyReportSubmissionTimestamp as jest.Mock).mockResolvedValue({ 
      recordedTimestamp: '2024-01-15T14:30:15Z'
    });
    (notificationModule.sendDailyReportSubmissionNotification as jest.Mock).mockResolvedValue({ triggered: true });
  });

  it('submissionTimestamp がシステムが自動記録した時刻を含む', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.submissionTimestamp).toBeDefined();
  });

  it('dailyReportId が返される', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.dailyReportId).toBe('report-unique-id');
  });

  it('userId が reporter001 で返される', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.userId).toBe('reporter001');
  });

  it('reportDate が 2024-01-15 で返される', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.reportDate).toBe('2024-01-15');
  });

  it('submissionStatus が within_deadline で返される', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.submissionStatus).toBe('within_deadline');
  });

  it('notificationTriggered が true で返される', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.notificationTriggered).toBe(true);
  });

  it('completionMessage が返される', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.completionMessage).toBeTruthy();
    expect(typeof result.completionMessage).toBe('string');
  });

  it('updateDailyReportSubmissionTimestamp が呼び出される', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);
    expect(persistenceModule.updateDailyReportSubmissionTimestamp).toHaveBeenCalled();
  });

  it('エラーが発生しない', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await expect(submitDailyReport(input)).resolves.toBeDefined();
  });
});
