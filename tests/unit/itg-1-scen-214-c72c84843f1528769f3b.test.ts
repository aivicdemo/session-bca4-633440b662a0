import { jest } from '@jest/globals';
import { submitDailyReport, NotificationTriggerFailedException } from '../../src/logic/daily-report-submission';
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

describe('SCEN-214: リーダー通知の発火に失敗した場合、notificationTriggered が false で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendDailyReportSubmissionNotification が例外をスローする場合、notificationTriggered=false で日報は保存される', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
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

    (checkDailyReportExistsForDate as any).mockResolvedValue({
      exists: false,
    });

    (judgeBusinessDayAndDeadline as any).mockResolvedValue({
      submissionStatus: 'within_deadline',
    });

    (saveDailyReport as any).mockResolvedValue({
      dailyReportId: 'report-20240115-001',
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: input.businessContent,
      submissionTimestamp: '2024-01-15T16:30:00Z',
      submissionStatus: 'within_deadline',
    });

    (updateDailyReportSubmissionTimestamp as any).mockResolvedValue({
      dailyReportId: 'report-20240115-001',
    });

    (sendDailyReportSubmissionNotification as any).mockRejectedValue(
      new NotificationTriggerFailedException()
    );

    const output = await submitDailyReport(input);

    expect(output).toBeDefined();
    expect(output.notificationTriggered).toBe(false);
    expect(output.dailyReportId).toBe('report-20240115-001');
    expect(output.userId).toBe('reporter-001');
    expect(output.reportDate).toBe('2024-01-15');
    expect(output.submissionTimestamp).toBe('2024-01-15T16:30:00Z');
    expect(output.submissionStatus).toBe('within_deadline');
    expect(output.completionMessage).toBeDefined();

    expect(saveDailyReport as any).toHaveBeenCalled();
    expect(updateDailyReportSubmissionTimestamp as any).toHaveBeenCalled();
    expect(sendDailyReportSubmissionNotification as any).toHaveBeenCalled();
  });
});
