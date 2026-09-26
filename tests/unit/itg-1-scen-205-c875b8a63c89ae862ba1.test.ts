import { submitDailyReport, SubmissionDeadlineExceededException } from '../../src/logic/daily-report-submission';
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

describe('SCEN-205: 提出時刻が定時期限を超過している場合、期限超過エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({ authorized: true });
    (validationModule.validateDailyReportContent as jest.MockedFunction<any>).mockResolvedValue({ valid: true });
    (deadlineModule.judgeBusinessDayAndDeadline as jest.MockedFunction<any>).mockRejectedValue(
      new SubmissionDeadlineExceededException('日報提出期限を超過しています。')
    );
  });

  it('提出時刻が定時期限を超過している場合、SubmissionDeadlineExceededException が発生する', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクトの進捗を確認した',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(SubmissionDeadlineExceededException);
  });

  it('例外のエラー文言が「日報提出期限を超過しています。」と一致する', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクトの進捗を確認した',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    try {
      await submitDailyReport(input);
      fail('should have thrown SubmissionDeadlineExceededException');
    } catch (error) {
      expect(error).toBeInstanceOf(SubmissionDeadlineExceededException);
      expect((error as Error).message).toBe('日報提出期限を超過しています。');
    }
  });

  it('期限超過時点で saveDailyReport は呼び出されない', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクトの進捗を確認した',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch {}

    expect(persistenceModule.saveDailyReport).not.toHaveBeenCalled();
  });

  it('期限超過時点で updateDailyReportSubmissionTimestamp は呼び出されない', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクトの進捗を確認した',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch {}

    expect(persistenceModule.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
  });

  it('期限超過時点で sendDailyReportSubmissionNotification は呼び出されない', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクトの進捗を確認した',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch {}

    expect(notificationModule.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
