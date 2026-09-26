import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  DailyReportContentInvalidError,
  type SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-483: 日報の入力内容が空白または必須項目が不足している場合、DailyReportContentInvalidError が発生してメール生成に失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reportContent が空文字列の場合、DailyReportContentInvalidError が発生すること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '報告者',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new DailyReportContentInvalidError('日報の内容が不完全であるため、通知メールを生成できません。')
    );

    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow(DailyReportContentInvalidError);
    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow('日報の内容が不完全であるため、通知メールを生成できません。');
  });
});
