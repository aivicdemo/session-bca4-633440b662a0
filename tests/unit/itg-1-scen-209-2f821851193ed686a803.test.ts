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

describe('SCEN-209: 提出時刻が期限内である場合、submissionStatus が within_deadline として返される', () => {
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
      dailyReportId: 'report-009',
    });

    (persistence.updateDailyReportSubmissionTimestamp as jest.Mock<any>).mockResolvedValue({
      success: true,
    });

    (notification.sendDailyReportSubmissionNotification as jest.Mock<any>).mockResolvedValue({
      triggered: true,
    });
  });

  it('提出時刻が期限内である場合、submissionStatus が within_deadline として返される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日のタスクを完了した',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T16:59:00Z',
    };

    const result = await submitDailyReport(input);

    // 戻り値の検証
    expect(result).toBeDefined();
    const output = result as SubmitDailyReportOutput;
    expect(output.submissionStatus).toBe('within_deadline');
    expect(output.dailyReportId).toBeTruthy();
    expect(typeof output.dailyReportId).toBe('string');
    expect(output.userId).toBe('reporter001');
    expect(output.reportDate).toBe('2024-01-15');
    expect(output.submissionTimestamp).toBe('2024-01-15T16:59:00Z');
    expect(output.notificationTriggered).toBe(true);
    expect(output.completionMessage).toBeTruthy();
    expect(typeof output.completionMessage).toBe('string');
  });
});
