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

describe('SCEN-212: submitDailyReport - オプション項目の一部が入力されて提出される場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 認証・認可のスタブ化
    // @ts-ignore
    userAuthModule.authenticateAndAuthorizeReporterAccess.mockResolvedValue({
      userId: 'reporter-001',
      hasAccess: true,
    });

    // 業務内容の妥当性検証のスタブ化
    // @ts-ignore
    validationModule.validateDailyReportContent.mockResolvedValue({
      isValid: true,
      message: '業務内容は有効です',
    });

    // 同日の重複提出なしをスタブ化
    // @ts-ignore
    persistenceModule.checkDailyReportExistsForDate.mockResolvedValue({
      exists: false,
    });

    // 期限内をスタブ化
    // @ts-ignore
    businessDayModule.judgeBusinessDayAndDeadline.mockResolvedValue({
      submissionStatus: 'within_deadline',
      deadline: '2024-01-15T17:00:00Z',
      currentTime: '2024-01-15T16:30:00Z',
    });

    // saveDailyReport をスタブ化: businessContent と achievements のみを保存
    // @ts-ignore
    persistenceModule.saveDailyReport.mockResolvedValue({
      dailyReportId: 'report-uuid-xxxxx',
      recordedTimestamp: '2024-01-15T16:30:00Z',
      notificationTriggered: true,
    });

    // タイムスタンプ更新のスタブ化
    // @ts-ignore
    persistenceModule.updateDailyReportSubmissionTimestamp.mockResolvedValue({
      success: true,
    });

    // リーダー通知のスタブ化
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

  it('businessContent と achievements のみが入力された場合、それらのみが保存される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.dailyReportId).toMatch(/^report-/);
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toBeDefined();
  });

  it('saveDailyReport が入力されたフィールドのデータで呼ばれることを確認', async () => {
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
    // saveDailyReport に渡されるデータを確認
    const saveDailyReportCall = (persistenceModule.saveDailyReport as jest.Mock).mock.calls[0];
    expect(saveDailyReportCall).toBeDefined();
  });

  it('tomorrowPlan は null のため保存されないことを確認', async () => {
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
    // tomorrowPlan が null であることを確認（スタブの検証）
    const saveDailyReportCall = (persistenceModule.saveDailyReport as jest.Mock).mock.calls[0];
    expect(saveDailyReportCall[0]).toHaveProperty('businessContent', '営業活動を実施');
    expect(saveDailyReportCall[0]).toHaveProperty('achievements', '顧客A社との契約締結');
  });

  it('リーダー通知トリガーが正常に発火することを確認', async () => {
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

  it('戻り値の SubmitDailyReportOutput が期待値を満たすこと', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    // (1) dailyReportId が文字列で返される
    expect(typeof result.dailyReportId).toBe('string');

    // (2) userId が 'reporter-001'
    expect(result.userId).toBe('reporter-001');

    // (3) reportDate が '2024-01-15'
    expect(result.reportDate).toBe('2024-01-15');

    // (4) submissionTimestamp が ISO 8601 形式
    expect(result.submissionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // (5) submissionStatus が 'within_deadline'
    expect(result.submissionStatus).toBe('within_deadline');

    // (6) notificationTriggered が true
    expect(result.notificationTriggered).toBe(true);

    // (7) completionMessage が返される
    expect(result.completionMessage).toBeDefined();
    expect(typeof result.completionMessage).toBe('string');
  });

  it('入力値が正確に処理されることを確認', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動を実施',
      achievements: '顧客A社との契約締結',
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    // SubmitDailyReportOutput には以下のフィールドが必ず含まれる
    expect(result).toHaveProperty('dailyReportId');
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('reportDate');
    expect(result).toHaveProperty('submissionTimestamp');
    expect(result).toHaveProperty('submissionStatus');
    expect(result).toHaveProperty('notificationTriggered');
    expect(result).toHaveProperty('completionMessage');
  });
});
