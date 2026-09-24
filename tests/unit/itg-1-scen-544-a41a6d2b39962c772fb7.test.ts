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

describe('SCEN-544: totalTargetsが催促対象者リストの件数と一致する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('totalTargetsが催促対象者リストの件数と一致すること', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'U001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
        { userId: 'U002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
        { userId: 'U003', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.totalTargets).toBe(3);
    expect(result.totalTargets).toBe(input.nonSubmittedReporters.length);
  });
});
