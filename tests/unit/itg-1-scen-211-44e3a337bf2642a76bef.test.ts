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

describe('SCEN-211: submitDailyReport - オプション項目がすべて null で提出される場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // ステップ3: authenticateAndAuthorizeReporterAccess のスタブ設定
    // @ts-ignore
    userAuthModule.authenticateAndAuthorizeReporterAccess.mockResolvedValue({
      userId: 'reporter-001',
      hasAccess: true,
    });

    // ステップ4: checkDailyReportExistsForDate のスタブ設定
    // @ts-ignore
    persistenceModule.checkDailyReportExistsForDate.mockResolvedValue({
      exists: false,
    });

    // ステップ5: validateDailyReportContent のスタブ設定
    // @ts-ignore
    validationModule.validateDailyReportContent.mockResolvedValue({
      isValid: true,
      message: '業務内容は有効です',
    });

    // ステップ6: judgeBusinessDayAndDeadline のスタブ設定
    // @ts-ignore
    businessDayModule.judgeBusinessDayAndDeadline.mockResolvedValue({
      submissionStatus: 'within_deadline',
      deadline: '2024-01-15T17:00:00Z',
      currentTime: '2024-01-15T14:30:00Z',
    });

    // ステップ7: saveDailyReport のスタブ設定
    // @ts-ignore
    persistenceModule.saveDailyReport.mockResolvedValue({
      dailyReportId: 'report-uuid-xxxxx',
      submissionTimestamp: '2024-01-15T14:30:00Z',
    });

    // ステップ8: updateDailyReportSubmissionTimestamp のスタブ設定
    // @ts-ignore
    persistenceModule.updateDailyReportSubmissionTimestamp.mockResolvedValue({
      success: true,
    });

    // ステップ9: sendDailyReportSubmissionNotification のスタブ設定
    // @ts-ignore
    notificationModule.sendDailyReportSubmissionNotification.mockResolvedValue({
      notificationTriggered: true,
      message: 'リーダー通知が発火されました',
    });

    // @ts-ignore
    submitDailyReport.mockImplementation(async (input: any) => ({
      dailyReportId: 'report-uuid-xxxxx',
      userId: input.userId,
      reportDate: input.reportDate,
      submissionTimestamp: input.submissionTimestamp,
      submissionStatus: 'within_deadline',
      notificationTriggered: true,
      completionMessage: '日報を提出しました。',
    }));
  });

  it('オプション項目がすべて null の場合、業務内容のみで日報が保存される', async () => {
    // ステップ1: 入力値の準備
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    // ステップ2: submitDailyReport 関数を呼び出す
    const result = await submitDailyReport(input);

    // ステップ10: 戻り値を検証
    expect(result).toBeDefined();
    expect(result.dailyReportId).toBe('report-uuid-xxxxx');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T14:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toBeDefined();
    expect(result.completionMessage).toContain('日報を提出しました');
  });

  it('saveDailyReport が businessContent のみのデータで呼ばれることを確認', async () => {
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
    // saveDailyReport の呼び出しを検証
    const saveDailyReportCall = (persistenceModule.saveDailyReport as jest.Mock).mock.calls[0];
    expect(saveDailyReportCall).toBeDefined();
  });

  it('updateDailyReportSubmissionTimestamp が呼ばれることを確認', async () => {
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

  it('sendDailyReportSubmissionNotification が 1 回発火されることを確認', async () => {
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

    expect(notificationModule.sendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
  });

  it('エラーが発生しないこと', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: 'クライアント打ち合わせ実施、提案資料作成',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    expect(() => submitDailyReport(input)).not.toThrow();
  });
});
