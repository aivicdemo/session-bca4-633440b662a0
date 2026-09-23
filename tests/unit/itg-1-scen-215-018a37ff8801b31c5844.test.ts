import { jest } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-submission';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateDailyReportContent } from '../../src/logic/input-validation-formatting';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import {
  checkDailyReportExistsForDate,
  saveDailyReport,
  updateDailyReportSubmissionTimestamp,
} from '../../src/logic/daily-report-persistence';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-215: システムが自動記録した提出時刻がレスポンスの submissionTimestamp に含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submitDailyReport が自動記録した提出時刻をレスポンスに含める', async () => {
    const systemRecordedTimestamp = '2024-01-15T16:45:30Z';

    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客Aシステムの仕様確認とテスト環境構築を実施した',
      achievements: 'テスト環境構築完了',
      challenges: 'リソース不足により一部作業が遅延',
      tomorrowPlan: '本番環境への移行準備',
      submissionTimestamp: '2024-01-15T16:30:00Z',
    };

    (authenticateAndAuthorizeReporterAccess as any).mockResolvedValue({
      authenticated: true,
      eligible: true,
    });

    (checkDailyReportExistsForDate as any).mockResolvedValue({
      exists: false,
    });

    (validateDailyReportContent as any).mockResolvedValue({
      isValid: true,
    });

    (judgeBusinessDayAndDeadline as any).mockResolvedValue({
      isBusinessDay: true,
      submissionStatus: 'within_deadline',
    });

    (saveDailyReport as any).mockResolvedValue({
      dailyReportId: 'report-20240115-001',
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: input.businessContent,
      achievements: input.achievements,
      challenges: input.challenges,
      tomorrowPlan: input.tomorrowPlan,
      submissionTimestamp: systemRecordedTimestamp,
      submissionStatus: 'within_deadline',
    });

    (updateDailyReportSubmissionTimestamp as any).mockResolvedValue({
      dailyReportId: 'report-20240115-001',
      submissionTimestamp: systemRecordedTimestamp,
    });

    (sendDailyReportSubmissionNotification as any).mockResolvedValue({
      notificationTriggered: true,
    });

    const output = await submitDailyReport(input);

    expect(output).toBeDefined();
    expect(output.dailyReportId).toBe('report-20240115-001');
    expect(output.userId).toBe('reporter001');
    expect(output.reportDate).toBe('2024-01-15');
    expect(output.submissionStatus).toBe('within_deadline');
    expect(output.notificationTriggered).toBe(true);
    expect(output.completionMessage).toBeDefined();

    expect(output.submissionTimestamp).toBe(systemRecordedTimestamp);

    expect(authenticateAndAuthorizeReporterAccess as any).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'reporter001' })
    );
    expect(checkDailyReportExistsForDate as any).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'reporter001',
        reportDate: '2024-01-15',
      })
    );
    expect(validateDailyReportContent as any).toHaveBeenCalledWith(
      expect.objectContaining({ businessContent: input.businessContent })
    );
    expect(judgeBusinessDayAndDeadline as any).toHaveBeenCalledWith(
      expect.objectContaining({ reportDate: '2024-01-15' })
    );
    expect(saveDailyReport as any).toHaveBeenCalled();
    expect(updateDailyReportSubmissionTimestamp as any).toHaveBeenCalled();
    expect(sendDailyReportSubmissionNotification as any).toHaveBeenCalled();
  });
});
