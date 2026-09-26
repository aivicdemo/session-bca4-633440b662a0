import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  LeaderEmailAddressInvalidError,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-522: 複数の入力値が同時に不正な場合、最初に検出されたエラーが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('LeaderEmailAddressInvalidError がスロー（throw）される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'invalid_reporter',
      dailyReportId: 'DR001',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: 'invalid_email',
      reporterName: 'テスト太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
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
