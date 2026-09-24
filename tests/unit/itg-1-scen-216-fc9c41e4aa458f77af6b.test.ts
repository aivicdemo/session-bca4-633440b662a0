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

import { submitDailyReport } from '../../src/logic/daily-report-submission';
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

describe('SCEN-216: 業務ルール recordDailyReportSubmission が送信時刻記録・送信完了判定・リーダー通知トリガー発火を実行する', () => {
  const userId = 'reporter-001';
  const reportDate = '2024-01-15';
  const businessContent = '本日は顧客A社との打ち合わせを実施し、Q1プロジェクト進捗を共有した。';
  const submissionTimestamp = '2024-01-15T16:30:00Z';
  const dailyReportId = 'DR-2024-01-15-001';

  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue(true);

    mockedValidateDailyReportContent.mockResolvedValue(true);

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      deadline: '2024-01-15T17:00:00Z',
    });

    mockedCheckDailyReportExistsForDate.mockResolvedValue(false);

    mockedSaveDailyReport.mockResolvedValue({
      dailyReportId: dailyReportId,
      success: true,
    });

    mockedUpdateDailyReportSubmissionTimestamp.mockResolvedValue(true);

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      triggered: true,
    });
  });

  it('submitDailyReport が送信時刻記録・送信完了判定・リーダー通知トリガー発火を実行する', async () => {
    const result = await submitDailyReport({
      userId,
      reportDate,
      businessContent,
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp,
    });

    // 期待結果：戻り値の検証
    expect(result.dailyReportId).toBe(dailyReportId);
    expect(result.userId).toBe(userId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.submissionTimestamp).toBe(submissionTimestamp);
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toBeDefined();

    // 追加検証：各関数の呼び出しを確認
    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
    expect(mockedAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledWith(
      expect.objectContaining({ userId })
    );

    expect(mockedValidateDailyReportContent).toHaveBeenCalledTimes(1);
    expect(mockedValidateDailyReportContent).toHaveBeenCalledWith(
      expect.objectContaining({ businessContent })
    );

    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalledTimes(1);
    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalledWith(
      expect.objectContaining({ submissionTimestamp })
    );

    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalledTimes(1);
    expect(mockedCheckDailyReportExistsForDate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        reportDate,
      })
    );

    expect(mockedSaveDailyReport).toHaveBeenCalledTimes(1);
    expect(mockedSaveDailyReport).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        reportDate,
        businessContent,
      })
    );

    expect(mockedUpdateDailyReportSubmissionTimestamp).toHaveBeenCalledTimes(1);
    expect(mockedUpdateDailyReportSubmissionTimestamp).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyReportId,
        submissionTimestamp,
      })
    );

    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
    expect(mockedSendDailyReportSubmissionNotification).toHaveBeenCalledWith(
      expect.objectContaining({ dailyReportId })
    );
  });
});
