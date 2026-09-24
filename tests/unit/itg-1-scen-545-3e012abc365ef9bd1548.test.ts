jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn().mockResolvedValue({ isValid: true }),
  buildNotificationContent: jest.fn().mockResolvedValue({
    subject: '日報の提出をお願いします',
    body: 'お忙しいところ恐れ入りますが、日報の提出をお願いいたします。',
  }),
  recordEmailSendingHistory: jest.fn()
    .mockResolvedValueOnce({ emailSendingHistoryId: 'hist-001' })
    .mockResolvedValueOnce({ emailSendingHistoryId: 'hist-002' })
    .mockResolvedValueOnce({ emailSendingHistoryId: 'hist-003' }),
}));

jest.mock('../../src/adapters/amazon-ses-adapter', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

describe('SCEN-545: successCountがメール送信に成功した対象者の数と一致する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successCountがメール送信に成功した対象者の数と一致すること', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'user1', userName: 'User 1', userEmailAddress: 'user1@example.com', targetDate: '2024-01-15' },
        { userId: 'user2', userName: 'User 2', userEmailAddress: 'user2@example.com', targetDate: '2024-01-15' },
        { userId: 'user3', userName: 'User 3', userEmailAddress: 'user3@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-12345',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.successCount).toBe(3);
    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.emailSendingHistoryIds).toEqual(['hist-001', 'hist-002', 'hist-003']);
  });
});
