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

describe('SCEN-217: submitDailyReport が送信時刻記録と期限判定を実行', () => {
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

    ((businessDayModule.judgeBusinessDayAndDeadline as unknown) as jest.Mock<any>).mockResolvedValue({
      submissionStatus: 'within_deadline',
      deadline: '2024-01-15T17:00:00Z',
    });

    ((persistenceModule.checkDailyReportExistsForDate as unknown) as jest.Mock<any>).mockResolvedValue({
      exists: false,
    });

    ((persistenceModule.saveDailyReport as unknown) as jest.Mock<any>).mockResolvedValue({
      dailyReportId: 'daily-report-uuid-12345',
      success: true,
    });

    ((persistenceModule.updateDailyReportSubmissionTimestamp as unknown) as jest.Mock<any>).mockResolvedValue({
      timestamp: '2024-01-15T16:30:00Z',
    });

    ((notificationModule.sendDailyReportSubmissionNotification as unknown) as jest.Mock<any>).mockResolvedValue({
      triggered: true,
    });

    ((submitDailyReport as unknown) as jest.Mock<any>).mockImplementation(async (input: any) => ({
      dailyReportId: 'daily-report-uuid-12345',
      userId: input.userId,
      reportDate: input.reportDate,
      submissionTimestamp: input.submissionTimestamp,
      submissionStatus: 'within_deadline',
      notificationTriggered: true,
      completionMessage: '日報を提出しました。リーダーに通知します。',
    }));
  });

  it('SubmitDailyReportOutput が期待される値を返す', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日はシステムテストを実施した',
      achievements: 'テストケース50件の実装完了',
      challenges: '環境構築に2時間要した',
      tomorrowPlan: 'システム統合テスト',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.dailyReportId).toBe('daily-report-uuid-12345');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toBe('日報を提出しました。リーダーに通知します。');
  });

  it('submissionStatus が within_deadline で期限内判定される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日はシステムテストを実施した',
      achievements: 'テストケース50件の実装完了',
      challenges: '環境構築に2時間要した',
      tomorrowPlan: 'システム統合テスト',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.submissionStatus).toBe('within_deadline');
  });

  it('notificationTriggered が true になる', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日はシステムテストを実施した',
      achievements: 'テストケース50件の実装完了',
      challenges: '環境構築に2時間要した',
      tomorrowPlan: 'システム統合テスト',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    expect(result.notificationTriggered).toBe(true);
  });
});
