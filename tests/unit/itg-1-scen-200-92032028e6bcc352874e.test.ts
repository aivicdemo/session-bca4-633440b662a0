import { jest } from '@jest/globals';
import {
  submitDailyReport,
  SubmitDailyReportInput,
  SubmitDailyReportOutput,
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

describe('SCEN-200: 日報提出正常系', () => {
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

    (notification.sendDailyReportSubmissionNotification as jest.Mock<any>).mockResolvedValue({
      triggered: true,
    });
  });

  it('報告者が認証済みで提出資格があり、業務内容が有効で、期限内に初回提出した場合、日報が保存され提出完了となりリーダー通知が発火する', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2025-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義ドキュメントを初版作成した',
      achievements: '要件定義ドキュメント初版完成',
      challenges: '追加質問への回答待ち',
      tomorrowPlan: '顧客回答確認、レビュー準備',
      submissionTimestamp: '2025-01-15T16:30:00Z',
    };

    const result = await submitDailyReport(input);

    // 戻り値の検証
    expect(result).toBeDefined();
    const output = result as SubmitDailyReportOutput;
    expect(output.dailyReportId).toBeTruthy();
    expect(output.userId).toBe('reporter-001');
    expect(output.reportDate).toBe('2025-01-15');
    expect(output.submissionTimestamp).toBe('2025-01-15T16:30:00Z');
    expect(output.submissionStatus).toBe('within_deadline');
    expect(output.notificationTriggered).toBe(true);
    expect(output.completionMessage).toContain('日報が正常に保存されました。リーダーへの通知を送信しました。');

    // 呼び出し順序と回数の検証
    expect(userAuth.authenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
    expect(validation.validateDailyReportContent).toHaveBeenCalledTimes(1);
    expect(judgment.judgeBusinessDayAndDeadline).toHaveBeenCalledTimes(1);
    expect(persistence.checkDailyReportExistsForDate).toHaveBeenCalledTimes(1);
    expect(persistence.saveDailyReport).toHaveBeenCalledTimes(1);
    expect(persistence.updateDailyReportSubmissionTimestamp).toHaveBeenCalledTimes(1);
    expect(notification.sendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
  });
});
