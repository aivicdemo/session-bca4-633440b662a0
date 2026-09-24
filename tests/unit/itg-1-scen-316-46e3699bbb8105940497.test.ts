jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management');

import {
  sendLeaderNonSubmissionPromptNotification,
  EmailDeliveryFailureError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-316: メール送信サービスが利用不可またはメール送信に失敗したとき、EmailDeliveryFailureErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信失敗でEmailDeliveryFailureErrorが発生し、エラー文言を含む', async () => {
    const input = {
      leaderId: '有効なリーダーID',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['レポーターID1', 'レポーターID2'],
      reminderSettingId: '有効なリマインダー設定ID',
      executionTimestamp: new Date('2024-01-15T10:00:00'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(EmailDeliveryFailureError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow('Failed to send notification email to leader.');
  });
});
