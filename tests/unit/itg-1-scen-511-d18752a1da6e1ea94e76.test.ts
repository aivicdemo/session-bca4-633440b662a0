import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  DailyReportContentInvalidError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-511: 報告内容が空のテキストの場合、sendDailyReportNotificationEmail で「報告内容が空です。何をしたかを入力してください」のエラーが発生する', () => {
  let mockSendDailyReportSubmissionNotification: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
  });

  it('報告内容が空文字列の場合、DailyReportContentInvalidError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockSendDailyReportSubmissionNotification.mockRejectedValue(
      new DailyReportContentInvalidError('日報の内容が不完全であるため、通知メールを生成できません。')
    );

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(DailyReportContentInvalidError);
  });
});
