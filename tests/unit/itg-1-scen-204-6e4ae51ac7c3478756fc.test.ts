import { jest } from '@jest/globals';
import {
  submitDailyReport,
  SubmitDailyReportInput,
  DailyReportContentExceedsMaxLengthException,
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

describe('SCEN-204: 業務内容が最大文字数を超過している場合、超過エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (userAuth.authenticateAndAuthorizeReporterAccess as jest.Mock<any>).mockResolvedValue({
      isAuthenticated: true,
      isEligible: true,
    });

    (validation.validateDailyReportContent as jest.Mock<any>).mockRejectedValue(
      new DailyReportContentExceedsMaxLengthException('日報内容が長すぎます。')
    );

    (persistence.checkDailyReportExistsForDate as jest.Mock<any>).mockResolvedValue({
      exists: false,
    });
  });

  it('業務内容が1000文字を超える場合、DailyReportContentExceedsMaxLengthException例外をスロー', async () => {
    const tooLongContent = 'a'.repeat(1001);
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: tooLongContent,
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentExceedsMaxLengthException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報内容が長すぎます。');

    // 業務内容検証以降の処理は呼び出されていない
    expect(persistence.saveDailyReport).not.toHaveBeenCalled();
    expect(persistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(notification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
