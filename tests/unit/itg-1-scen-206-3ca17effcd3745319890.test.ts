import { jest } from '@jest/globals';
import {
  submitDailyReport,
  SubmitDailyReportInput,
  DuplicateSubmissionForDateException,
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

describe('SCEN-206: 同一報告者が同一報告日に既に提出済みの場合、重複提出エラーが発生して提出が拒否される', () => {
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

    (persistence.checkDailyReportExistsForDate as jest.Mock<any>).mockRejectedValue(
      new DuplicateSubmissionForDateException('本日の日報は既に提出済みです。')
    );
  });

  it('同一報告者が同一報告日に既に提出済みの場合、DuplicateSubmissionForDateException例外をスロー', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '有効な業務内容テキスト',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DuplicateSubmissionForDateException);
    await expect(submitDailyReport(input)).rejects.toThrow('本日の日報は既に提出済みです。');

    // 重複提出チェック以降の処理は呼び出されていない
    expect(persistence.saveDailyReport).not.toHaveBeenCalled();
    expect(persistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(notification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
