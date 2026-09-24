jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));
jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateDailyReportContent: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  checkDailyReportExistsForDate: jest.fn(),
  saveDailyReport: jest.fn(),
  updateDailyReportSubmissionTimestamp: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import { submitDailyReport, SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-submission';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { checkDailyReportExistsForDate, saveDailyReport, updateDailyReportSubmissionTimestamp } from '../../src/logic/daily-report-persistence';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedValidateDailyReportContent = validateDailyReportContent as jest.Mock;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedCheckDailyReportExistsForDate = checkDailyReportExistsForDate as jest.Mock;
const mockedSaveDailyReport = saveDailyReport as jest.Mock;
const mockedUpdateDailyReportSubmissionTimestamp = updateDailyReportSubmissionTimestamp as jest.Mock;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.Mock;

describe('SCEN-200: 報告者が認証済みで提出資格があり、業務内容が有効で、期限内に初回提出した場合、日報が保存され提出完了となりリーダー通知が発火する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      userId: 'reporter-001',
      isAuthenticated: true,
      isEligibleForSubmission: true,
    });

    mockedValidateDailyReportContent.mockResolvedValue({
      isValid: true,
      content: '本日は顧客A社のヒアリングを実施し、要件定義ドキュメントを初版作成した',
    });

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isWithinDeadline: true,
      submissionStatus: 'within_deadline',
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue({
      exists: false,
    });

    mockedSaveDailyReport.mockResolvedValue({
      dailyReportId: 'report-12345',
      userId: 'reporter-001',
      reportDate: '2025-01-15',
    });

    mockedUpdateDailyReportSubmissionTimestamp.mockResolvedValue({
      dailyReportId: 'report-12345',
      submissionTimestamp: '2025-01-15T16:30:00Z',
    });

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      notificationTriggered: true,
      leaderId: 'leader-001',
    });
  });

  it('should submit daily report successfully with all validations passing', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2025-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義ドキュメントを初版作成した',
      achievements: '要件定義ドキュメント初版完成',
      challenges: '追加質問への回答待ち',
      tomorrowPlan: '顧客回答確認、レビュー準備',
      submissionTimestamp: '2025-01-15T16:30:00Z',
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.dailyReportId).toBeTruthy();
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2025-01-15');
    expect(result.submissionTimestamp).toBe('2025-01-15T16:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toContain('日報が正常に保存されました。リーダーへの通知を送信しました。');

    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
    expect(mockedValidateDailyReportContent).toHaveBeenCalledTimes(1);
    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalledTimes(1);
    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalledTimes(1);
    expect(mockedSaveDailyReport).toHaveBeenCalledTimes(1);
    expect(mockedUpdateDailyReportSubmissionTimestamp).toHaveBeenCalledTimes(1);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
  });
});
