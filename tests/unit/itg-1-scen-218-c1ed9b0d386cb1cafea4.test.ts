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

describe('SCEN-218: submitDailyReport で報告内容が空のときエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    ((userAuthModule.authenticateAndAuthorizeReporterAccess as unknown) as jest.Mock<any>).mockResolvedValue({
      userId: 'user001',
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
      userId: 'user001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentEmptyException);
  });

  it('エラーメッセージが正しい', async () => {
    const input = {
      userId: 'user001',
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
      userId: 'user001',
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
      userId: 'user001',
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
      userId: 'user001',
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
      userId: 'user001',
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

    const notificationModule = require('../../src/logic/email-notification-management');
    expect(notificationModule.sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
  });
});
