import { jest } from '@jest/globals';
import {
  submitDailyReport,
  SubmitDailyReportInput,
  ReporterNotEligibleForSubmissionException,
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

describe('SCEN-202: 報告者が提出対象外または無効化されている場合、提出資格なしエラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (userAuth.authenticateAndAuthorizeReporterAccess as jest.Mock<any>).mockRejectedValue(
      new ReporterNotEligibleForSubmissionException('この報告者は日報提出対象外です。')
    );
  });

  it('提出資格なしの報告者の日報提出はReporterNotEligibleForSubmissionException例外をスロー', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(ReporterNotEligibleForSubmissionException);
    await expect(submitDailyReport(input)).rejects.toThrow('この報告者は日報提出対象外です。');

    // 後続の処理は呼び出されていない
    expect(validation.validateDailyReportContent).not.toHaveBeenCalled();
    expect(judgment.judgeBusinessDayAndDeadline).not.toHaveBeenCalled();
    expect(persistence.checkDailyReportExistsForDate).not.toHaveBeenCalled();
    expect(persistence.saveDailyReport).not.toHaveBeenCalled();
    expect(persistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(notification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
