jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isBusinessDay: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
}));

import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.Mock;

describe('SCEN-748: メール送信が3回失敗した場合、管理者に通知され検知ログに記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信が3回失敗した場合、管理者への通知が送信される', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    mockedIsBusinessDay.mockResolvedValue(true);

    mockedSendNonSubmissionPromptNotification.mockRejectedValue(
      new Error('Email delivery failed')
    );

    let adminNotificationSent = false;
    let failureLog: any = null;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation((message: any) => {
      if (typeof message === 'string' && message.includes('送信失敗')) {
        adminNotificationSent = true;
        failureLog = message;
      }
    });

    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(false);
    expect(mockedSendNonSubmissionPromptNotification).toHaveBeenCalledTimes(3);
    expect(adminNotificationSent).toBe(true);
    expect(failureLog).toBeTruthy();
    expect(failureLog).toMatch(/送信失敗/);
    expect(failureLog).toMatch(/3回/);

    consoleSpy.mockRestore();
  });
});
