import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-550: 報告期限の時刻が不正な形式のとき、throw文言が発生する', () => {
  it('報告期限の時刻が不正な形式のとき、エラーがスローされる', async () => {
    const invalidTargetDates = ['25:00', '1700', '17-00', '17:00:00', ''];

    for (const invalidDate of invalidTargetDates) {
      const input: SendNonSubmissionPromptNotificationInput = {
        nonSubmittedReporters: [
          { userId: 'U001', userName: '田中太郎', userEmailAddress: 'taro@example.com', targetDate: '2024-01-15' },
        ],
        leaderUserId: 'L001',
        leaderEmailAddress: 'leader@example.com',
        detectionLogId: 'DL001',
        promptReason: '定時リマインダー',
        targetDate: invalidDate,
      };

      try {
        await sendNonSubmissionPromptNotification(input);
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('報告期限の設定が不正です');
        }
      }
    }
  });
});
