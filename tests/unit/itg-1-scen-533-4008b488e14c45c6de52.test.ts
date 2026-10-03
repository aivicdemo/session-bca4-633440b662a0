import { sendNonSubmissionPromptNotification, InvalidLeaderEmailError } from '../../src/logic/email-notification-management';

describe('SCEN-533: リーダーのメールアドレスが無効な形式のとき、InvalidLeaderEmailErrorが発生する', () => {
  it('should throw InvalidLeaderEmailError when leaderEmailAddress is invalid', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'user001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
        { userId: 'user002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-format',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow(InvalidLeaderEmailError);
    await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow('リーダーのメールアドレスが無効です。');
  });
});
