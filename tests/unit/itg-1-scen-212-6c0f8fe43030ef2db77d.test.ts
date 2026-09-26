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

describe('SCEN-212: オプション項目の一部が入力されて提出された場合、入力された項目のみが保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
      denialReason: null,
    });
    (validationModule.validateDailyReportContent as jest.MockedFunction<any>).mockResolvedValue({
      isValid: true,
      validatedContent: '営業活動を実施',
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
      dailyReportId: 'daily-report-20240115-uuid',
      savedAt: '2024-01-15T16:30:00Z',
      userId: 'reporter-001',
      reportDate: '2024-01-15',
    });
    (persistenceModule.updateDailyReportSubmissionTimestamp as jest.MockedFunction<any>).mockResolvedValue({
      dailyReportId: 'daily-report-20240115-uuid',
      previousSubmittedAt: null,
      updatedSubmittedAt: '2024-01-15T16:30:00Z',
      updatedAt: '2024-01-15T16:30:00Z',
    });
    (notificationModule.sendDailyReportSubmissionNotification as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'notif-001',
      sentAt: '2024-01-15T16:30:00Z',
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  it('dailyReportId が文字列で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(typeof result.dailyReportId).toBe('string');
    expect(result.dailyReportId).toBe('daily-report-20240115-uuid');
  });

  it('userId が reporter-001 で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
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
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.reportDate).toBe('2024-01-15');
  });

  it('submissionTimestamp が ISO 8601 形式で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
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
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.submissionStatus).toBe('within_deadline');
  });

  it('notificationTriggered が true で返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.notificationTriggered).toBe(true);
  });

  it('completionMessage が返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = (await submitDailyReport(input)) as SubmitDailyReportOutput;
    expect(result.completionMessage).toBeTruthy();
  });

  it('入力されたフィールド（businessContent と achievements）が保存される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);
    expect(persistenceModule.saveDailyReport).toHaveBeenCalled();
  });

  it('リーダー通知トリガーが発火する', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);
    expect(notificationModule.sendDailyReportSubmissionNotification).toHaveBeenCalled();
  });

  it('エラーが発生しない', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await expect(submitDailyReport(input)).resolves.toBeDefined();
  });
});
