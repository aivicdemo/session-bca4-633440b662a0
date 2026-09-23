import { jest } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-submission';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { checkDailyReportExistsForDate, saveDailyReport } from '../../src/logic/daily-report-persistence';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-213: リーダー通知が正常に発火した場合、notificationTriggered が true で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submitDailyReport が正常にリーダー通知を発火する場合、notificationTriggered=true を返す', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社のシステム設計レビューを実施し、基本設計書の承認を得た',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    (authenticateAndAuthorizeReporterAccess as any).mockResolvedValue({
      authenticated: true,
      eligible: true,
    });

    (validateDailyReportContent as any).mockResolvedValue({
      isValid: true,
    });

    (judgeBusinessDayAndDeadline as any).mockResolvedValue({
      submissionStatus: 'within_deadline',
    });

    (checkDailyReportExistsForDate as any).mockResolvedValue({
      exists: false,
    });

    (saveDailyReport as any).mockResolvedValue({
      dailyReportId: 'daily-report-20240115-001',
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: input.businessContent,
      submissionTimestamp: '2024-01-15T16:30:00Z',
      submissionStatus: 'within_deadline',
    });

    (sendDailyReportSubmissionNotification as any).mockResolvedValue({
      success: true,
    });

    const output = await submitDailyReport(input);

    expect(output).toBeDefined();
    expect(output.notificationTriggered).toBe(true);
    expect(output.dailyReportId).toBe('daily-report-20240115-001');
    expect(output.userId).toBe('reporter-001');
    expect(output.reportDate).toBe('2024-01-15');
    expect(output.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
    expect(output.submissionStatus).toBe('within_deadline');
    expect(output.completionMessage).toBeDefined();

    expect(authenticateAndAuthorizeReporterAccess as any).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'reporter-001' })
    );
    expect(validateDailyReportContent as any).toHaveBeenCalledWith(
      expect.objectContaining({ businessContent: input.businessContent })
    );
    expect(judgeBusinessDayAndDeadline as any).toHaveBeenCalledWith(
      expect.objectContaining({ submissionTimestamp: '2024-01-15T16:30:00Z' })
    );
    expect(checkDailyReportExistsForDate as any).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'reporter-001',
        reportDate: '2024-01-15',
      })
    );
    expect(saveDailyReport as any).toHaveBeenCalled();
    expect(sendDailyReportSubmissionNotification as any).toHaveBeenCalled();
  });
});
