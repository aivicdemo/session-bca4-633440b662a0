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

describe('SCEN-540: 全件成功時、failedReporterIdsがnullで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全件成功時、failedReporterIdsがnullで返されること', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'user001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
        { userId: 'user002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
        { userId: 'user003', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2024-01-15' },
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
    expect(result.emailSendingHistoryIds.length).toBe(3);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
  });
});
