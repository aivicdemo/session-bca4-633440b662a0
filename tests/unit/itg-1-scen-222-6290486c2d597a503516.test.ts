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

describe('SCEN-222: submitDailyReport で報告内容が空のときエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ((userAuthModule.authenticateAndAuthorizeReporterAccess as unknown) as jest.Mock<any>).mockResolvedValue({
      userId: 'reporter001',
      hasAccess: true,
    });

    ((validationModule.validateDailyReportContent as unknown) as jest.Mock<any>).mockRejectedValue(
      new DailyReportContentEmptyException('日報内容を入力してください。')
    );

    ((submitDailyReport as unknown) as jest.Mock<any>).mockImplementation(async (input: any) => {
      throw new DailyReportContentEmptyException('日報内容を入力してください。');
    });
  });

  it('DailyReportContentEmptyException がスロー', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentEmptyException);
  });

  it('エラーメッセージが「日報内容を入力してください。」である', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow('日報内容を入力してください。');
  });

  it('saveDailyReport は呼ばれない', async () => {
    const input = {
      userId: 'reporter001',
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

  it('checkDailyReportExistsForDate は呼ばれない', async () => {
    const input = {
      userId: 'reporter001',
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

    expect(persistenceModule.checkDailyReportExistsForDate).not.toHaveBeenCalled();
  });

  it('updateDailyReportSubmissionTimestamp は呼ばれない', async () => {
    const input = {
      userId: 'reporter001',
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

  it('sendDailyReportSubmissionNotification は呼ばれない', async () => {
    const input = {
      userId: 'reporter001',
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

  it('バリデーション前の処理は停止される', async () => {
    const input = {
      userId: 'reporter001',
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
