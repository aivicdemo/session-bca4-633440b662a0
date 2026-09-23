import { jest } from '@jest/globals';
import {
  submitDailyReport,
  SubmitDailyReportInput,
  ReporterNotAuthenticatedException,
} from '../../src/logic/daily-report-submission';
import * as userAuth from '../../src/logic/user-authentication-authorization';
import * as validation from '../../src/logic/input-validation-formatting';
import * as persistence from '../../src/logic/daily-report-persistence';
import * as notification from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-201: 報告者が未認証またはアカウント無効の場合、認証エラーが発生して提出が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (userAuth.authenticateAndAuthorizeReporterAccess as jest.Mock<any>).mockRejectedValue(
      new ReporterNotAuthenticatedException('報告者の認証に失敗しました。ログインしてください。')
    );
  });

  it('未認証ユーザーの日報提出はReporterNotAuthenticatedException例外をスロー', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-unauthenticated',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(ReporterNotAuthenticatedException);
    await expect(submitDailyReport(input)).rejects.toThrow('報告者の認証に失敗しました。ログインしてください。');

    // 認証後の処理は呼び出されていない
    expect(validation.validateDailyReportContent).not.toHaveBeenCalled();
    expect(persistence.checkDailyReportExistsForDate).not.toHaveBeenCalled();
    expect(persistence.saveDailyReport).not.toHaveBeenCalled();
    expect(persistence.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
    expect(notification.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
