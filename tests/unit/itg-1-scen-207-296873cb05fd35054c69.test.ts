import { jest } from '@jest/globals';
import {
  submitDailyReport,
  SubmitDailyReportInput,
  PersistenceDailyReportFailedException,
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

describe('SCEN-207: 日報レコードの保存に失敗した場合、永続化エラーが発生して提出が失敗する', () => {
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

    (persistence.saveDailyReport as jest.Mock<any>).mockRejectedValue(
      new PersistenceDailyReportFailedException('日報の保存に失敗しました。')
    );
  });

  it('日報レコードの保存に失敗した場合、PersistenceDailyReportFailedException例外をスロー', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(PersistenceDailyReportFailedException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報の保存に失敗しました。');

    // 永続化失敗後の処理は呼び出されていない
    expect(persistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(notification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
