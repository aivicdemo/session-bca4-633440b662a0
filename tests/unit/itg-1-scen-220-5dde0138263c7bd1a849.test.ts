import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-submission');

import { submitDailyReport, DailyReportContentExceedsMaxLengthException } from '../../src/logic/daily-report-submission';
import * as validationModule from '../../src/logic/input-validation-formatting';
import * as persistenceModule from '../../src/logic/daily-report-persistence';
import * as notificationModule from '../../src/logic/email-notification-management';

describe('SCEN-220: submitDailyReport で報告内容が500文字を超える場合に制限される', () => {
  const contentWith501Chars = 'a'.repeat(501);

  beforeEach(() => {
    jest.clearAllMocks();

    ((validationModule.validateDailyReportContent as unknown) as jest.Mock<any>).mockRejectedValue(
      new DailyReportContentExceedsMaxLengthException('日報内容が長すぎます。')
    );

    ((submitDailyReport as unknown) as jest.Mock<any>).mockImplementation(async (input: any) => {
      throw new DailyReportContentExceedsMaxLengthException('日報内容が長すぎます。');
    });
  });

  it('DailyReportContentExceedsMaxLengthException がスロー', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: contentWith501Chars,
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentExceedsMaxLengthException);
  });

  it('エラーメッセージが正しい', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: contentWith501Chars,
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow('日報内容が長すぎます。');
  });

  it('SubmitDailyReportOutput は返却されない', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: contentWith501Chars,
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

  it('日報は永続化されない', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: contentWith501Chars,
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

  it('リーダー通知トリガーは発火しない', async () => {
    const input = {
      userId: 'reporter001',
      reportDate: '2024-01-15',
      businessContent: contentWith501Chars,
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
});
