import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

describe('SCEN-543: 送信処理の実行日時がISO 8601形式で返される', () => {
  it('sentAtフィールドがISO 8601形式の日時を返す', async () => {
    const nonSubmittedReporters = [
      { userId: 'U001', userName: '太郎', userEmailAddress: 'u1@example.com', targetDate: '2025-01-15' },
      { userId: 'U002', userName: '花子', userEmailAddress: 'u2@example.com', targetDate: '2025-01-15' },
      { userId: 'U003', userName: '次郎', userEmailAddress: 'u3@example.com', targetDate: '2025-01-15' },
    ];

    const result = await sendNonSubmissionPromptNotification({
      nonSubmittedReporters,
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'DL-001',
      promptReason: '定時リマインダー',
      targetDate: '2025-01-15',
    });

    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(result.sentAt).toMatch(isoRegex);
  });
});
