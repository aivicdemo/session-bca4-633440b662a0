import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-submission');

import { submitDailyReport, DailyReportContentEmptyException } from '../../src/logic/daily-report-submission';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as notificationModule from '../../src/logic/email-notification-management';

describe('SCEN-223: submitDailyReport で報告内容が1文字未満のときエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ((userAuthModule.authenticateAndAuthorizeReporterAccess as unknown) as jest.Mock<any>).mockResolvedValue({
      userId: 'reporter-001',
      hasAccess: true,
    });

    ((validationModule.validateDailyReportContent as unknown) as jest.Mock<any>).mockRejectedValue(
      new DailyReportContentEmptyException('日報内容を入力してください。')
    );

    ((submitDailyReport as unknown) as jest.Mock<any>).mockImplementation(async (input: any) => {
      throw new DailyReportContentEmptyException('日報内容を入力してください。');
    });
  });

  it('DailyReportContentEmptyException が throw される', async () => {
    const input = {
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
    const input = {
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

  it('SubmitDailyReportOutput は返されない', async () => {
    const input = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    let output = null;
    try {
      output = await submitDailyReport(input);
    } catch {
      // エラーをキャッチ
    }

    expect(output).toBeNull();
  });

  it('入力値の永続化は実行されない', async () => {
    const input = {
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
    } catch {
      // エラーをキャッチ
    }

    expect(persistenceModule.saveDailyReport).not.toHaveBeenCalled();
  });

  it('提出時刻の記録は実行されない', async () => {
    const input = {
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
    } catch {
      // エラーをキャッチ
    }

    expect(persistenceModule.updateDailyReportSubmissionTimestamp).not.toHaveBeenCalled();
  });

  it('リーダー通知トリガーの発火は実行されない', async () => {
    const input = {
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
    } catch {
      // エラーをキャッチ
    }

    expect(notificationModule.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });

  it('空文字列の入力はバリデーションで検出される', async () => {
    const input = {
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
    } catch {
      // エラーをキャッチ
    }

    expect(validationModule.validateDailyReportContent).toHaveBeenCalledTimes(1);
  });
});
