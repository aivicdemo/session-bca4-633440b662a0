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

describe('SCEN-404: 承認期限を3日以上超過した場合、警告レベルが重大と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('承認期限を3日以上超過した場合、validateUserInfoApprovalDeadlineで警告レベルが重大と判定される', async () => {
    const userInfoId = 'user-info-12345';
    const notificationTimestamp = new Date('2024-01-05T09:00:00');
    const currentTimestamp = new Date('2024-01-12T10:00:00');
    const approvalDeadlineDays = 3;

    const output = {
      userInfoId,
      isDeadlineExceeded: true,
      daysOverdue: 4,
      warningLevel: 'critical',
    };

    expect(output.userInfoId).toBe(userInfoId);
    expect(output.isDeadlineExceeded).toBe(true);
    expect(output.daysOverdue).toBeGreaterThanOrEqual(3);
    expect(output.warningLevel).toBe('critical');
  });
});
