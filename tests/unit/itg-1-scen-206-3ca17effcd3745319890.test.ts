import { submitDailyReport, DuplicateSubmissionForDateException } from '../../src/logic/daily-report-submission';
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

describe('SCEN-206: 同一報告者が同一報告日に既に提出済みの場合、重複提出エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({ authorized: true });
    (validationModule.validateDailyReportContent as jest.MockedFunction<any>).mockResolvedValue({ valid: true });
    (deadlineModule.judgeBusinessDayAndDeadline as jest.MockedFunction<any>).mockResolvedValue({ status: 'within_deadline' });
    (persistenceModule.checkDailyReportExistsForDate as jest.MockedFunction<any>).mockResolvedValue(true);
  });

  it('同一報告者が同一報告日に既に提出済みの場合、DuplicateSubmissionForDateException が発生する', async () => {
    const input = {
      userId: 'reporter-test-001',
      reportDate: '2024-01-15',
      businessContent: '有効な業務内容テキスト',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:00:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DuplicateSubmissionForDateException);
  });

  it('エラーメッセージが「本日の日報は既に提出済みです。」と一致する', async () => {
    const input = {
      userId: 'reporter-test-001',
      reportDate: '2024-01-15',
      businessContent: '有効な業務内容テキスト',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:00:00Z',
    };

    try {
      await submitDailyReport(input);
      fail('should have thrown DuplicateSubmissionForDateException');
    } catch (error) {
      expect(error).toBeInstanceOf(DuplicateSubmissionForDateException);
      expect((error as Error).message).toBe('本日の日報は既に提出済みです。');
    }
  });

  it('重複提出検出時に saveDailyReport は呼び出されない', async () => {
    const input = {
      userId: 'reporter-test-001',
      reportDate: '2024-01-15',
      businessContent: '有効な業務内容テキスト',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:00:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch {}

    expect(persistenceModule.saveDailyReport).not.toHaveBeenCalled();
  });

  it('重複提出検出時に updateDailyReportSubmissionTimestamp は呼び出されない', async () => {
    const input = {
      userId: 'reporter-test-001',
      reportDate: '2024-01-15',
      businessContent: '有効な業務内容テキスト',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:00:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch {}

    expect(persistenceModule.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
  });

  it('重複提出検出時に sendDailyReportSubmissionNotification は呼び出されない', async () => {
    const input = {
      userId: 'reporter-test-001',
      reportDate: '2024-01-15',
      businessContent: '有効な業務内容テキスト',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:00:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch {}

    expect(notificationModule.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
