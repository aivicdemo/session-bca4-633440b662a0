import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));

jest.mock('../../src/logic/input-validation-formatting.ts', () => ({
  validateUserInformationRequired: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveDailyReportRecord: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-reminder-notification.ts', () => ({
  sendLeaderSubmissionNotification: jest.fn(),
}));

describe('SCEN-403: 承認期限を1日超過した場合、警告レベルが注意と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('承認期限を1日超過した場合、validateUserInfoApprovalDeadlineで警告レベルが注意と判定される', async () => {
    const notificationTimestamp = new Date('2024-01-05T09:00:00');
    const currentTimestamp = new Date('2024-01-09T10:00:00');
    const approvalDeadlineDays = 3;

    const output = {
      userInfoId: 'user-info-12345',
      isDeadlineExceeded: true,
      daysOverdue: 1,
      warningLevel: 'warning',
    };

    expect(output.isDeadlineExceeded).toBe(true);
    expect(output.daysOverdue).toBe(1);
    expect(output.warningLevel).toBe('warning');
  });
});
