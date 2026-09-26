import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-521: reporterName が null の場合、メール本文生成時にエラーになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('success=false 、errorMessage がエラーメッセージになり、adminNotificationSent=true になる', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter001',
      dailyReportId: 'report001',
      reportContent: '本日は営業資料の作成に従事しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: null as any,
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);
    mockSend.mockResolvedValue({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: '報告者の氏名が登録されていないため、メール本文を生成できません',
      adminNotificationSent: true,
    } as SendDailyReportSubmissionNotificationOutput);

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toMatch(/報告者の(氏名が登録されていない|情報が不完全)/);
    expect(result.adminNotificationSent).toBe(true);
  });
});
