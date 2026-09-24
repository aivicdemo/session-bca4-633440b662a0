jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn().mockResolvedValue({ isValid: true }),
  buildNotificationContent: jest.fn().mockResolvedValue({
    subject: '日報の提出をお願いします',
    body: 'お忙しいところ恐れ入りますが、日報の提出をお願いいたします。',
  }),
  recordEmailSendingHistory: jest.fn()
    .mockResolvedValueOnce({ emailSendingHistoryId: 'SH-2025-01-15-001' })
    .mockResolvedValueOnce({ emailSendingHistoryId: 'SH-2025-01-15-002' })
    .mockResolvedValueOnce({ emailSendingHistoryId: 'SH-2025-01-15-003' }),
}));

jest.mock('../../src/adapters/amazon-ses-adapter', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

describe('SCEN-541: 全件成功時、errorMessageがnullで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全件成功時、errorMessageがnullで返されること', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'U001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2025-01-15' },
        { userId: 'U002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2025-01-15' },
        { userId: 'U003', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2025-01-15' },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'DL-2025-01-15-001',
      promptReason: '定時リマインダー',
      targetDate: '2025-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds).toEqual(['SH-2025-01-15-001', 'SH-2025-01-15-002', 'SH-2025-01-15-003']);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
  });
});
