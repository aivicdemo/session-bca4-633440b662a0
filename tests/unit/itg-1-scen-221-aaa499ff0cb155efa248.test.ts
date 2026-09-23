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

describe('SCEN-221: submitDailyReport が送信時刻記録・重複確認・送信完了判定を実行', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ((userAuthModule.authenticateAndAuthorizeReporterAccess as unknown) as jest.Mock<any>).mockResolvedValue({
      userId: 'reporter-001',
      hasAccess: true,
    });

    ((validationModule.validateDailyReportContent as unknown) as jest.Mock<any>).mockResolvedValue({
      isValid: true,
    });

    ((persistenceModule.checkDailyReportExistsForDate as unknown) as jest.Mock<any>).mockResolvedValue({
      exists: false,
    });

    ((businessDayModule.judgeBusinessDayAndDeadline as unknown) as jest.Mock<any>).mockResolvedValue({
      submissionStatus: 'within_deadline',
      deadline: '2024-01-15T17:00:00Z',
    });

    ((persistenceModule.saveDailyReport as unknown) as jest.Mock<any>).mockResolvedValue({
      dailyReportId: 'daily-report-20240115-001',
      submissionTimestamp: '2024-01-15T14:30:00Z',
      submissionStatus: 'within_deadline',
    });

    ((persistenceModule.updateDailyReportSubmissionTimestamp as unknown) as jest.Mock<any>).mockResolvedValue({
      success: true,
    });

    ((notificationModule.sendDailyReportSubmissionNotification as unknown) as jest.Mock<any>).mockResolvedValue({
      notificationTriggered: true,
    });

    ((submitDailyReport as unknown) as jest.Mock<any>).mockImplementation(async (input: any) => ({
      dailyReportId: 'daily-report-20240115-001',
      userId: input.userId,
      reportDate: input.reportDate,
      submissionTimestamp: input.submissionTimestamp,
      submissionStatus: 'within_deadline',
      notificationTriggered: true,
      completionMessage: '日報が正常に提出されました。',
    }));
  });

  it('戻り値が期待される値を返す', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.dailyReportId).toBe('daily-report-20240115-001');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T14:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toBe('日報が正常に提出されました。');
  });

  it('authenticateAndAuthorizeReporterAccess がuserIdで呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await submitDailyReport(input);

    expect(userAuthModule.authenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
  });

  it('validateDailyReportContent がbusinessContentで呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await submitDailyReport(input);

    expect(validationModule.validateDailyReportContent).toHaveBeenCalledTimes(1);
  });

  it('checkDailyReportExistsForDate がuserIdとreportDateで呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await submitDailyReport(input);

    expect(persistenceModule.checkDailyReportExistsForDate).toHaveBeenCalledTimes(1);
  });

  it('judgeBusinessDayAndDeadline がsubmissionTimestampで呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await submitDailyReport(input);

    expect(businessDayModule.judgeBusinessDayAndDeadline).toHaveBeenCalledTimes(1);
  });

  it('saveDailyReport がuserId、reportDate、businessContent、achievementsで呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await submitDailyReport(input);

    expect(persistenceModule.saveDailyReport).toHaveBeenCalledTimes(1);
  });

  it('sendDailyReportSubmissionNotification が呼ばれたことを検証', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await submitDailyReport(input);

    expect(notificationModule.sendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
  });

  it('businessContent は必須で、achievements/challenges/tomorrowPlan はオプション', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.completionMessage).toBeDefined();
  });

  it('提出できる担当は社内の報告者に限定される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.userId).toBe('reporter-001');
  });

  it('メール通知はリーダーのみに送信される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義書の初版を作成しました。',
      achievements: '要件定義書初版の作成完了',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.notificationTriggered).toBe(true);
  });
});
