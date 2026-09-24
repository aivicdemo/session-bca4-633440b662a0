jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isBusinessDay: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
}));

import { getActiveReportersForSubmissionCheck, isReporterActiveAndValid } from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.Mock;

describe('SCEN-747: メール送信が失敗した場合、失敗を検知ログに記録し、最大3回まで指数バックオフで再試行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('メール送信が1回目失敗後、指数バックオフで最大3回再試行される', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    mockedIsBusinessDay.mockResolvedValue(true);

    const callTimestamps: number[] = [];

    mockedSendNonSubmissionPromptNotification.mockImplementation((input: any) => {
      callTimestamps.push(Date.now());
      if (callTimestamps.length < 3) {
        return Promise.reject(new Error('Email send failed'));
      }
      return Promise.resolve({
        success: true,
        sentAt: new Date(),
        notificationId: 'NOTIF-001',
      });
    });

    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(true);
    expect(mockedSendNonSubmissionPromptNotification).toHaveBeenCalledTimes(3);

    if (callTimestamps.length >= 2) {
      const firstRetryWait = callTimestamps[1] - callTimestamps[0];
      expect(firstRetryWait).toBeGreaterThanOrEqual(900);
      expect(firstRetryWait).toBeLessThanOrEqual(1100);
    }

    if (callTimestamps.length >= 3) {
      const secondRetryWait = callTimestamps[2] - callTimestamps[1];
      expect(secondRetryWait).toBeGreaterThanOrEqual(1900);
      expect(secondRetryWait).toBeLessThanOrEqual(2100);
    }
  });
});
