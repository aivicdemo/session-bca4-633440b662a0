import { jest } from '@jest/globals';
import {
  submitDailyReport,
  SubmitDailyReportInput,
  SubmissionDeadlineExceededException,
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

describe('SCEN-205: 提出時刻が定時期限を超過している場合、期限超過エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (userAuth.authenticateAndAuthorizeReporterAccess as jest.Mock<any>).mockResolvedValue({
      isAuthenticated: true,
      isEligible: true,
    });

    (validation.validateDailyReportContent as jest.Mock<any>).mockResolvedValue({
      isValid: true,
    });

    (judgment.judgeBusinessDayAndDeadline as jest.Mock<any>).mockRejectedValue(
      new SubmissionDeadlineExceededException('日報提出期限を超過しています。')
    );
  });

  it('提出時刻が定時期限を超過している場合、SubmissionDeadlineExceededException例外をスロー', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日は顧客A社との打ち合わせを実施し、Q1プロジェクトの進捗を確認した',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(SubmissionDeadlineExceededException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報提出期限を超過しています。');

    // 期限判定以降の処理は呼び出されていない
    expect(persistence.saveDailyReport).not.toHaveBeenCalled();
    expect(persistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(notification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
