jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn().mockResolvedValue({ isValid: true }),
  buildNotificationContent: jest.fn().mockResolvedValue({
    subject: '日報の提出をお願いします',
    body: 'お忙しいところ恐れ入りますが、日報の提出をお願いいたします。',
  }),
  recordEmailSendingHistory: jest.fn()
    .mockResolvedValueOnce({ emailSendingHistoryId: 'history-001' })
    .mockResolvedValueOnce({ emailSendingHistoryId: 'history-002' })
    .mockResolvedValueOnce({ emailSendingHistoryId: 'history-003' }),
}));

jest.mock('../../src/adapters/amazon-ses-adapter', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import { validateEmailAddressForDelivery, buildNotificationContent, recordEmailSendingHistory } from '../../src/logic/email-notification-management';

describe('SCEN-538: メール送信成功時、全ての催促対象者の送信履歴が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全ての催促対象者へのメール送信が成功し、全ての送信履歴IDが記録されること', async () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'user001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user002',
          userName: '鈴木花子',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user003',
          userName: '佐藤次郎',
          userEmailAddress: 'sato@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds).toEqual(['history-001', 'history-002', 'history-003']);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();

    expect(recordEmailSendingHistory).toHaveBeenCalledTimes(3);
    expect(validateEmailAddressForDelivery).toHaveBeenCalledTimes(3);
    expect(buildNotificationContent).toHaveBeenCalledTimes(3);
  });
});
