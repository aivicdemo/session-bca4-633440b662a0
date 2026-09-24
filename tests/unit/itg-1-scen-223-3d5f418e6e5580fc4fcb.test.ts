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

  it('businessContent フィールドに空文字列を設定した SubmitDailyReportInput で DailyReportContentEmptyException が throw される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentEmptyException);
  });

  it('エラー文言が「日報内容を入力してください。」である', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow('日報内容を入力してください。');
  });

  it('SubmitDailyReportOutput は返されず、エラーが発生する', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    let output = undefined;
    let errorOccurred = false;
    try {
      output = await submitDailyReport(input);
    } catch (error) {
      errorOccurred = true;
    }

    expect(errorOccurred).toBe(true);
    expect(output).toBeUndefined();
  });

  it('入力値の永続化は実行されない', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch (error) {
      // Expected error
    }

    expect((persistenceModule.saveDailyReport as jest.Mock)).not.toHaveBeenCalled();
  });

  it('提出時刻の記録は実行されない', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch (error) {
      // Expected error
    }

    expect((persistenceModule.updateDailyReportSubmissionTimestamp as jest.Mock)).not.toHaveBeenCalled();
  });

  it('リーダー通知トリガーの発火は実行されない', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    try {
      await submitDailyReport(input);
    } catch (error) {
      // Expected error
    }

    expect((notificationModule.sendDailyReportSubmissionNotification as jest.Mock)).not.toHaveBeenCalled();
  });
});
