import { sendNonSubmissionPromptNotification, InvalidLeaderEmailError } from '../../src/logic/email-notification-management';

describe('SCEN-534: リーダーのメールアドレスが空のとき、InvalidLeaderEmailErrorが発生する', () => {
  it('should throw InvalidLeaderEmailError when leaderEmailAddress is empty string', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'user001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow(InvalidLeaderEmailError);
    await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow('リーダーのメールアドレスが無効です。');
  });
});
