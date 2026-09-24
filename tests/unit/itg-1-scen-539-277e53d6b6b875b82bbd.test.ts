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
  sendEmail: jest.fn()
    .mockResolvedValueOnce({ success: true })
    .mockResolvedValueOnce({ success: false, error: 'Mail send failed' })
    .mockResolvedValueOnce({ success: false, error: 'Mail send failed' }),
}));

import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import { recordEmailSendingHistory } from '../../src/logic/email-notification-management';

describe('SCEN-539: メール送信失敗時でも、成功・失敗を問わず全ての送信履歴が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('一部のメール送信失敗時でも全ての送信履歴が記録されること', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'user1', userName: 'User 1', userEmailAddress: 'user1@example.com', targetDate: '2024-01-15' },
        { userId: 'user2', userName: 'User 2', userEmailAddress: 'user2@example.com', targetDate: '2024-01-15' },
        { userId: 'user3', userName: 'User 3', userEmailAddress: 'user3@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader1',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(false);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(2);
    expect(result.emailSendingHistoryIds).toEqual(['history-001', 'history-002', 'history-003']);
    expect(result.failedReporterIds).toEqual(['user2', 'user3']);
    expect(result.errorMessage).toContain('一部の催促メール送信に失敗しました');
    expect(result.errorMessage).toContain('成功件数: 1');
    expect(result.errorMessage).toContain('失敗件数: 2');

    expect(recordEmailSendingHistory).toHaveBeenCalledTimes(3);
  });
});
