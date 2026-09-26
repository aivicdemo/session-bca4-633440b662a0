import { describe, it, expect, jest, beforeEach } from '@jest/globals';

import {
  sendDailyReportSubmissionNotification,
  DailyReportContentInvalidError,
  type SendDailyReportSubmissionNotificationInput,
  type SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-525: 日報の入力内容が空文字列の場合、メール本文生成に失敗する', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reportContent が空文字列の場合、success=false, errorMessage を含む出力を返し、buildNotificationContent は呼び出されない', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter001',
      dailyReportId: 'report-123',
      reportContent: '',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const result: SendDailyReportSubmissionNotificationOutput =
      await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBe(null);
    expect(result.sentAt).toBe(null);
    expect(result.errorMessage).toBe(
      '日報の内容が不完全であるため、通知メールを生成できません。'
    );
    expect(result.adminNotificationSent).toBe(true);
  });
});
