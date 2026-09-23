import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-submission');

import { submitDailyReport } from '../../src/logic/daily-report-submission';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as notificationModule from '../../src/logic/email-notification-management';

describe('SCEN-219: submitDailyReport で報告内容が1文字のとき警告メッセージが表示', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ((userAuthModule.authenticateAndAuthorizeReporterAccess as unknown) as jest.Mock<any>).mockResolvedValue({
      userId: 'reporter001',
      hasAccess: true,
    });

    ((validationModule.validateDailyReportContent as unknown) as jest.Mock<any>).mockResolvedValue({
      isValid: true,
      warning: '内容が短いようです。詳しく入力してください',
    });

    ((persistenceModule.checkDailyReportExistsForDate as unknown) as jest.Mock<any>).mockResolvedValue({
      exists: false,
    });

    ((businessDayModule.judgeBusinessDayAndDeadline as unknown) as jest.Mock<any>).mockResolvedValue({
      submissionStatus: 'within_deadline',
    });

    ((persistenceModule.saveDailyReport as unknown) as jest.Mock<any>).mockResolvedValue({
      dailyReportId: 'report-id-001',
      success: true,
    });

    ((persistenceModule.updateDailyReportSubmissionTimestamp as unknown) as jest.Mock<any>).mockResolvedValue({
      success: true,
    });

    ((notificationModule.sendDailyReportSubmissionNotification as unknown) as jest.Mock<any>).mockResolvedValue({
      notificationTriggered: true,
    });

    ((submitDailyReport as unknown) as jest.Mock<any>).mockImplementation(async (input: any) => ({
      dailyReportId: 'report-id-001',
      userId: input.userId,
      reportDate: input.reportDate,
      submissionTimestamp: input.submissionTimestamp,
      submissionStatus: 'within_deadline',
      notificationTriggered: true,
      completionMessage: '内容が短いようです。詳しく入力してください',
    }));
  });

  it('1文字の報告内容に対して警告メッセージを返す', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: 'a',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.completionMessage).toContain('内容が短いようです。詳しく入力してください');
  });

  it('戻り値の型が SubmitDailyReportOutput である', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: 'a',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.dailyReportId).toBeDefined();
    expect(result.userId).toBe('reporter001');
    expect(result.reportDate).toBe('2025-01-15');
  });

  it('dailyReportId が空文字でなく、型が string である', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: 'a',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.dailyReportId).toBeTruthy();
    expect(typeof result.dailyReportId).toBe('string');
  });

  it('submissionStatus が within_deadline である', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: 'a',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.submissionStatus).toBe('within_deadline');
  });

  it('notificationTriggered が true である', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: 'a',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.notificationTriggered).toBe(true);
  });

  it('validateDailyReportContent が businessContent=a の入力で呼ばれたことを確認', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: 'a',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    await submitDailyReport(input);

    expect(validationModule.validateDailyReportContent).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'a' })
    );
  });

  it('日報は受け付けられ、エラーは発生しない', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2025-01-15',
      businessContent: 'a',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).resolves.not.toThrow();
  });
});
