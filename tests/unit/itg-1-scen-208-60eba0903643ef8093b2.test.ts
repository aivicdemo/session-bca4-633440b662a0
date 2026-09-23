import { jest } from '@jest/globals';
import {
  submitDailyReport,
  SubmitDailyReportInput,
  SubmitDailyReportOutput,
  NotificationTriggerFailedException,
} from '../../src/logic/daily-report-submission';
import * as userAuth from '../../src/logic/user-authentication-authorization';
import * as validation from '../../src/logic/input-validation-formatting';
import * as judgment from '../../src/logic/business-day-deadline-judgment';
import * as persistence from '../../src/logic/daily-report-persistence';
import * as notification from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-208: リーダー通知トリガーの発火に失敗した場合、通知エラーが発生するがシステムハンドリングされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (userAuth.authenticateAndAuthorizeReporterAccess as jest.Mock<any>).mockResolvedValue({
      isAuthenticated: true,
      isEligible: true,
    });

    (validation.validateDailyReportContent as jest.Mock<any>).mockResolvedValue({
      isValid: true,
    });

    (judgment.judgeBusinessDayAndDeadline as jest.Mock<any>).mockResolvedValue({
      isWithinDeadline: true,
    });

    (persistence.checkDailyReportExistsForDate as jest.Mock<any>).mockResolvedValue({
      exists: false,
    });

    (persistence.saveDailyReport as jest.Mock<any>).mockResolvedValue({
      dailyReportId: 'report-001',
    });

    (persistence.updateDailyReportSubmissionTimestamp as jest.Mock<any>).mockResolvedValue({
      success: true,
    });

    (notification.sendDailyReportSubmissionNotification as jest.Mock<any>).mockRejectedValue(
      new NotificationTriggerFailedException('通知の送信準備に失敗しました。')
    );
  });

  it('通知トリガー発火失敗はシステムハンドリングされ、日報は正常に保存される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aのシステム要件定義会議に出席し、業務フローを確認した',
      achievements: '要件定義ドキュメント初版完成',
      challenges: 'スケジュール遅延のリスク',
      tomorrowPlan: '実装設計着手',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    // 戻り値の検証
    expect(result).toBeDefined();
    const output = result as SubmitDailyReportOutput;
    expect(output.dailyReportId).toBeTruthy();
    expect(output.userId).toBe('reporter-001');
    expect(output.reportDate).toBe('2024-01-15');
    expect(output.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
    expect(output.submissionStatus).toBe('within_deadline');
    expect(output.notificationTriggered).toBe(false);
    expect(output.completionMessage).toContain('日報が保存されました。ただし、リーダーへの通知送信に失敗しました。');

    // 通知関数は呼び出されている
    expect(notification.sendDailyReportSubmissionNotification).toHaveBeenCalled();
  });
});
