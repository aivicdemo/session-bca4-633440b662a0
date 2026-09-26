
import {
  sendLeaderNonSubmissionPromptNotification,
  InvalidExecutionTimingError,
  SendLeaderNonSubmissionPromptNotificationInput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-317: 実行タイミングが営業日の営業時間外のとき、InvalidExecutionTimingErrorが発生する', () => {
  it('営業時間外のタイムスタンプで処理を実行すると、InvalidExecutionTimingErrorが発生し、メール送信は実行されない', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'reminder-setting-001',
      executionTimestamp: new Date('2024-01-15T22:00:00'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(InvalidExecutionTimingError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(
      'Execution timing is outside business hours or not a business day.'
    );
  });
});
