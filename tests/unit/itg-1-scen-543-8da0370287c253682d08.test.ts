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

describe('SCEN-543: 送信処理の実行日時がISO 8601形式で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('送信処理の実行日時がISO 8601形式で返されること', async () => {
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

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(result.sentAt).toMatch(iso8601Regex);
    
    // Parse the date to ensure it's a valid ISO 8601 format
    const parsedDate = new Date(result.sentAt);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate.getTime()).not.toBeNaN();
  });
});
