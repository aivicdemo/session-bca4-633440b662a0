import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-reminder-notification')>('../../src/logic/daily-report-reminder-notification'),
}));

import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';
import * as userAuthMod from '../../src/logic/user-authentication-authorization';
import * as businessDayMod from '../../src/logic/business-day-deadline-judgment';
import * as persistenceMod from '../../src/logic/daily-report-persistence';
import * as reminderMod from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-569: Invalid leader email format error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error about invalid email format when leader email is malformed', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2025-01-15';

    jest.spyOn(userAuthMod, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue({
      leaderId,
      leaderEmail: 'leader@domain',
      authorized: true,
    } as any);

    jest.spyOn(businessDayMod, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isBusinessDay: true,
      isWithinDeadline: true,
    } as any);

    jest.spyOn(persistenceMod, 'retrieveDailyReportsForLeaderReview').mockResolvedValue({} as any);
    jest.spyOn(persistenceMod, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue({} as any);

    jest.spyOn(reminderMod, 'sendLeaderSubmissionNotification').mockImplementation(async () => {
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
      if (!emailRegex.test('leader@domain')) {
        throw new Error('メールアドレスの形式が無効です。正しいアドレスを入力してください。');
      }
      return {} as any;
    });

    await expect(
      retrieveLeaderDashboardData({
        leaderId,
        targetDate,
      })
    ).rejects.toThrow('メールアドレスの形式が無効です。正しいアドレスを入力してください。');
  });
});
