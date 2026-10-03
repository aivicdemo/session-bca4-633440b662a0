import { submitDailyReport, type SubmitDailyReportInput } from '../../src/logic/daily-report-submission';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-200: 報告者が認証済みで提出資格があり、業務内容が有効で、期限内に初回提出した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockAuth = require('../../src/logic/user-authentication-authorization');
    const mockValidation = require('../../src/logic/input-validation-formatting');
    const mockBusinessDay = require('../../src/logic/business-day-deadline-judgment');
    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    mockAuth.authenticateAndAuthorizeReporterAccess = jest.fn().mockResolvedValue({ isAccessGranted: true });
    mockValidation.validateDailyReportContent = jest.fn().mockResolvedValue({ isValid: true });
    mockBusinessDay.judgeBusinessDayAndDeadline = jest.fn().mockResolvedValue({ isWithinDeadline: true });
    mockPersistence.checkDailyReportExistsForDate = jest.fn().mockResolvedValue(false);
    mockPersistence.saveDailyReport = jest.fn().mockResolvedValue({ dailyReportId: 'report-123' });
    mockPersistence.updateDailyReportSubmissionTimestamp = jest.fn().mockResolvedValue({ recordingSucceeded: true });
    mockNotification.sendDailyReportSubmissionNotification = jest.fn().mockResolvedValue({ notificationSent: true });
  });

  it('日報が保存され提出完了となりリーダー通知が発火する', async () => {
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

    expect(result.dailyReportId).not.toBe('');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2025-01-15');
    expect(result.submissionTimestamp).toBe('2025-01-15T16:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toContain('日報が正常に保存されました。リーダーへの通知を送信しました。');

    const mockAuth = require('../../src/logic/user-authentication-authorization');
    const mockValidation = require('../../src/logic/input-validation-formatting');
    const mockBusinessDay = require('../../src/logic/business-day-deadline-judgment');
    const mockPersistence = require('../../src/logic/daily-report-persistence');
    const mockNotification = require('../../src/logic/email-notification-management');

    expect(mockAuth.authenticateAndAuthorizeReporterAccess).toHaveBeenCalledTimes(1);
    expect(mockValidation.validateDailyReportContent).toHaveBeenCalledTimes(1);
    expect(mockBusinessDay.judgeBusinessDayAndDeadline).toHaveBeenCalledTimes(1);
    expect(mockPersistence.checkDailyReportExistsForDate).toHaveBeenCalledTimes(1);
    expect(mockPersistence.saveDailyReport).toHaveBeenCalledTimes(1);
    expect(mockPersistence.updateDailyReportSubmissionTimestamp).toHaveBeenCalledTimes(1);
    expect(mockNotification.sendDailyReportSubmissionNotification).toHaveBeenCalledTimes(1);
  });
});
