jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');

import { submitDailyReport, DailyReportContentEmptyException, SubmitDailyReportInput } from '../../src/logic/daily-report-submission';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as notificationModule from '../../src/logic/email-notification-management';

describe('SCEN-223: 業務ルール recordAndValidateDailyReportSubmission で報告内容が1文字未満のときエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DailyReportContentEmptyException が throw され、エラー文言が「日報内容を入力してください。」となること。入力値の永続化、提出時刻の記録、リーダー通知トリガーの発火は実行されないこと。', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    // DailyReportContentEmptyException がスローされ、エラー文言が正しいことを確認
    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentEmptyException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報内容を入力してください。');

    // 2回目の呼び出しで、永続化・記録・通知が実行されていないことを確認
    try {
      await submitDailyReport(input);
    } catch (error) {
      // Expected error
    }

    expect((persistenceModule.saveDailyReport as jest.MockedFunction<any>)).not.toHaveBeenCalled();
    expect((persistenceModule.updateDailyReportSubmissionTimestamp as jest.MockedFunction<any>)).not.toHaveBeenCalled();
    expect((notificationModule.sendDailyReportSubmissionNotification as jest.MockedFunction<any>)).not.toHaveBeenCalled();
  });
});
