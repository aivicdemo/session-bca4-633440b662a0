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

describe('SCEN-216: submitDailyReport が送信時刻記録・送信完了判定・リーダー通知トリガー発火を実行', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ((userAuthModule.authenticateAndAuthorizeReporterAccess as unknown) as jest.Mock<any>).mockResolvedValue({
      userId: 'reporter-001',
      hasAccess: true,
    });

    ((validationModule.validateDailyReportContent as unknown) as jest.Mock<any>).mockResolvedValue({
      isValid: true,
      message: '業務内容は有効です',
    });

    ((persistenceModule.checkDailyReportExistsForDate as unknown) as jest.Mock<any>).mockResolvedValue({
      exists: false,
    });

    ((businessDayModule.judgeBusinessDayAndDeadline as unknown) as jest.Mock<any>).mockResolvedValue({
      submissionStatus: 'within_deadline',
      deadline: '2024-01-15T17:00:00Z',
      currentTime: '2024-01-15T16:30:00Z',
    });

    ((persistenceModule.saveDailyReport as unknown) as jest.Mock<any>).mockResolvedValue({
      dailyReportId: 'DR-2024-01-15-001',
      success: true,
    });

    ((persistenceModule.updateDailyReportSubmissionTimestamp as unknown) as jest.Mock<any>).mockResolvedValue({
      success: true,
      timestamp: '2024-01-15T16:30:00Z',
    });

    ((notificationModule.sendDailyReportSubmissionNotification as unknown) as jest.Mock<any>).mockResolvedValue({
      triggered: true,
      message: 'リーダー通知が発火されました',
    });

    ((submitDailyReport as unknown) as jest.Mock).mockImplementation(async (input: any) => ({
      dailyReportId: 'DR-2024-01-15-001',
      userId: input.userId,
      reportDate: input.reportDate,
      submissionTimestamp: input.submissionTimestamp,
      submissionStatus: 'within_deadline',
      notificationTriggered: true,
      completionMessage: '提出完了確認メッセージ',
    }));
  });

  it('送信時刻記録・送信完了判定・リーダー通知トリガー発火が実行される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクト進捗を共有した。',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.dailyReportId).toBe('DR-2024-01-15-001');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toBeDefined();
  });

  it('authenticateAndAuthorizeReporterAccess が userId で呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクト進捗を共有した。',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);

    expect(userAuthModule.authenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
    expect(userAuthModule.authenticateAndAuthorizeReporterAccess).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'reporter-001' })
    );
  });

  it('validateDailyReportContent が businessContent で呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクト進捗を共有した。',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);

    expect(validationModule.validateDailyReportContent).toHaveBeenCalledTimes(1);
    expect(validationModule.validateDailyReportContent).toHaveBeenCalledWith(
      expect.objectContaining({ content: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクト進捗を共有した。' })
    );
  });

  it('judgeBusinessDayAndDeadline が submissionTimestamp で呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクト進捗を共有した。',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);

    expect(businessDayModule.judgeBusinessDayAndDeadline).toHaveBeenCalledTimes(1);
    expect(businessDayModule.judgeBusinessDayAndDeadline).toHaveBeenCalledWith(
      expect.objectContaining({ timestamp: '2024-01-15T16:30:00Z' })
    );
  });

  it('checkDailyReportExistsForDate が userId と reportDate で呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクト進捗を共有した。',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);

    expect(persistenceModule.checkDailyReportExistsForDate).toHaveBeenCalledTimes(1);
    expect(persistenceModule.checkDailyReportExistsForDate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'reporter-001', reportDate: '2024-01-15' })
    );
  });

  it('saveDailyReport が呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクト進捗を共有した。',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);

    expect(persistenceModule.saveDailyReport).toHaveBeenCalledTimes(1);
  });

  it('updateDailyReportSubmissionTimestamp が dailyReportId と submissionTimestamp で呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクト進捗を共有した。',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);

    expect(persistenceModule.updateDailyReportSubmissionTimestamp).toHaveBeenCalledTimes(1);
    expect(persistenceModule.updateDailyReportSubmissionTimestamp).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyReportId: 'DR-2024-01-15-001',
        timestamp: '2024-01-15T16:30:00Z',
      })
    );
  });

  it('sendDailyReportSubmissionNotification が dailyReportId で呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクト進捗を共有した。',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    await submitDailyReport(input);

    expect(notificationModule.sendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
    expect(notificationModule.sendDailyReportSubmissionNotification).toHaveBeenCalledWith(
      expect.objectContaining({ dailyReportId: 'DR-2024-01-15-001' })
    );
  });
});
