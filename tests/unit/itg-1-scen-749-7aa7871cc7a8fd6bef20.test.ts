jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isBusinessDay: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';
import { sendNonSubmissionPromptNotification, recordEmailSendingHistory } from '../../src/logic/email-notification-management';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-749: 検知ログにリマインダー送信結果（送信日時、対象者、送信成否）が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検知ログにリマインダー送信結果が記録される', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    mockedIsBusinessDay.mockResolvedValue(true);

    const sendTimestamp = new Date('2024-01-15T17:00:00+09:00');
    mockedSendNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      sentAt: sendTimestamp,
      notificationId: 'NOTIF-001',
    });

    mockedRecordEmailSendingHistory.mockResolvedValue({
      success: true,
      historyRecordId: 'HISTORY-001',
    });

    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(true);
    expect(result.reporters.length).toBeGreaterThan(0);
    expect(result.totalCount).toBeGreaterThan(0);

    expect(mockedSendNonSubmissionPromptNotification).toHaveBeenCalled();
    expect(mockedRecordEmailSendingHistory).toHaveBeenCalled();

    const historyCallArg = mockedRecordEmailSendingHistory.mock.calls[0][0];
    expect(historyCallArg).toHaveProperty('sentAt');
    expect(historyCallArg).toHaveProperty('targetUserIds');
    expect(historyCallArg).toHaveProperty('success');
  });
});
