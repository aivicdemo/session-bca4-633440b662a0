jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/email-notification-management');

import {
  sendLeaderSubmissionNotification,
  InvalidReporterIdError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-308: InvalidReporterIdError when invalid reporterId is provided', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const invalidReporterIds = [
    { value: '', description: 'empty string' },
    { value: null, description: 'null' },
    { value: undefined, description: 'undefined' },
    { value: '!@#$', description: 'special characters only' },
    { value: '123-456-789', description: 'different format' },
  ];

  invalidReporterIds.forEach(({ value, description }) => {
    it(`should throw InvalidReporterIdError with message "報告者IDが無効です。" when reporterId is ${description}`, async () => {
      const input = {
        reporterId: value as any,
        leaderId: 'leader-001',
        targetDate: new Date('2025-01-15'),
        submissionTimestamp: new Date('2025-01-15T09:30:00Z'),
        executionTimestamp: new Date('2025-01-15T09:35:00Z'),
      };

      await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow(InvalidReporterIdError);
      await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow('報告者IDが無効です。');
    });
  });
});
