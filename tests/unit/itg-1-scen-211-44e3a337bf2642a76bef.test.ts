import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

import { submitDailyReport, type SubmitDailyReportOutput } from '../../src/logic/daily-report-submission';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as deadlineModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as notificationModule from '../../src/logic/email-notification-management';

describe('SCEN-211: オプション項目（成果・課題・明日の予定）がすべて null で提出された場合、業務内容のみで日報が保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
      denialReason: null,
    });
    (validationModule.validateDailyReportContent as jest.MockedFunction<any>).mockResolvedValue({
      isValid: true,
      validatedContent: 'クライアント打ち合わせ実施、提案資料作成',
      errorCode: null,
    });
    (deadlineModule.judgeBusinessDayAndDeadline as jest.MockedFunction<any>).mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T18:00:00Z',
      processingPolicy: 'accept',
      rejectionReason: null,
    });
    (persistenceModule.checkDailyReportExistsForDate as jest.MockedFunction<any>).mockResolvedValue(false);
    (persistenceModule.saveDailyReport as jest.MockedFunction<any>).mockResolvedValue({
      dailyReportId: 'report-uuid-xxxxx',
      savedAt: '2024-01-15T14:30:00Z',
      userId: 'reporter-001',
      reportDate: '2024-01-15',
    });
    (persistenceModule.updateDailyReportSubmissionTimestamp as jest.MockedFunction<any>).mockResolvedValue({
      dailyReportId: 'report-uuid-xxxxx',
      previousSubmittedAt: null,
      updatedSubmittedAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
    });
    (notificationModule.sendDailyReportSubmissionNotification as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'notif-001',
      sentAt: '2024-01-15T14:30:00Z',
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  it('dailyReportId が返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.dailyReportId).toBe('report-uuid-xxxxx');
  });

  it('userId が入力値と一致する', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.userId).toBe('reporter-001');
  });

  it('reportDate が入力値と一致する', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.reportDate).toBe('2024-01-15');
  });

  it('submissionTimestamp が入力値と一致する', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.submissionTimestamp).toBe('2024-01-15T14:30:00Z');
  });

  it('submissionStatus が within_deadline で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.submissionStatus).toBe('within_deadline');
  });

  it('notificationTriggered が true で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.notificationTriggered).toBe(true);
  });

  it('completionMessage に値が含まれる', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.completionMessage).toBeTruthy();
    expect(typeof result.completionMessage).toBe('string');
  });

  it('saveDailyReport が呼び出される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await submitDailyReport(input);
    expect(persistenceModule.saveDailyReport).toHaveBeenCalled();
  });

  it('updateDailyReportSubmissionTimestamp が呼び出される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await submitDailyReport(input);
    expect(persistenceModule.updateDailyReportSubmissionTimestamp).toHaveBeenCalled();
  });

  it('sendDailyReportSubmissionNotification が呼び出される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await submitDailyReport(input);
    expect(notificationModule.sendDailyReportSubmissionNotification).toHaveBeenCalled();
  });

  it('エラーが発生しない', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).resolves.toBeDefined();
  });
});
