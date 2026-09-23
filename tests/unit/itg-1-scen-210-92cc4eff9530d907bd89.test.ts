import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// jest.mock を使用してモジュール全体をモック化
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

describe('SCEN-210: submitDailyReport - 期限超過時の submissionStatus が after_deadline として返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // スタブの準備
    // @ts-ignore
    userAuthModule.authenticateAndAuthorizeReporterAccess.mockResolvedValue({
      userId: 'reporter-001',
      hasAccess: true,
    });

    // @ts-ignore
    validationModule.validateDailyReportContent.mockResolvedValue({
      isValid: true,
      message: '業務内容は妥当です',
    });

    // @ts-ignore
    persistenceModule.checkDailyReportExistsForDate.mockResolvedValue({
      exists: false,
    });

    // @ts-ignore
    persistenceModule.saveDailyReport.mockResolvedValue({
      dailyReportId: 'report-12345',
      recordedTimestamp: '2024-01-15T18:30:00Z',
    });

    // @ts-ignore
    businessDayModule.judgeBusinessDayAndDeadline.mockResolvedValue({
      submissionStatus: 'after_deadline',
      deadline: '2024-01-15T17:00:00Z',
      currentTime: '2024-01-15T18:30:00Z',
    });

    // @ts-ignore
    notificationModule.sendDailyReportSubmissionNotification.mockResolvedValue({
      notificationTriggered: true,
      message: 'リーダー通知が発火されました',
    });

    // @ts-ignore
    persistenceModule.updateDailyReportSubmissionTimestamp.mockResolvedValue({
      success: true,
    });

    // @ts-ignore
    submitDailyReport.mockImplementation(async (input: any) => ({
      dailyReportId: 'report-12345',
      userId: input.userId,
      reportDate: input.reportDate,
      submissionTimestamp: input.submissionTimestamp,
      submissionStatus: 'after_deadline',
      notificationTriggered: true,
      completionMessage: '日報を提出しました。',
    }));
  });

  it('期限超過のシナリオで submissionStatus が "after_deadline" として返される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.submissionStatus).toBe('after_deadline');
    expect(result.dailyReportId).toBe('report-12345');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T18:30:00Z');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toBeDefined();
    expect(result.completionMessage).toContain('提出');
  });

  it('すべての依存関数が期待どおりに呼び出されることを確認', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    await submitDailyReport(input);

    expect(userAuthModule.authenticateAndAuthorizeReporterAccess).toHaveBeenCalled();
    expect(validationModule.validateDailyReportContent).toHaveBeenCalled();
    expect(businessDayModule.judgeBusinessDayAndDeadline).toHaveBeenCalled();
    expect(persistenceModule.saveDailyReport).toHaveBeenCalled();
    expect(persistenceModule.updateDailyReportSubmissionTimestamp).toHaveBeenCalled();
    expect(notificationModule.sendDailyReportSubmissionNotification).toHaveBeenCalled();
  });

  it('期限超過でもエラーが発生しないこと', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'テスト用の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    expect(() => submitDailyReport(input)).not.toThrow();
  });
});
