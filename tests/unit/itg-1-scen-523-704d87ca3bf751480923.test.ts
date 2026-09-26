import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-523: リーダーメールアドレスが空の場合、送信を中止してエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('success=false 、errorMessage=「チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。」、adminNotificationSent=true になる', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客対応とドキュメント作成を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T17:30:00Z',
    };

    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);
    mockSend.mockResolvedValue({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。',
      adminNotificationSent: true,
    } as SendDailyReportSubmissionNotificationOutput);

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);
  });
});
