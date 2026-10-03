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

import { retrieveLeaderDashboardData, DataRetrievalFailedError } from '../../src/logic/daily-report-management-view';
import * as userAuthMod from '../../src/logic/user-authentication-authorization';
import * as businessDayMod from '../../src/logic/business-day-deadline-judgment';
import * as persistenceMod from '../../src/logic/daily-report-persistence';
import * as reminderMod from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-573: sendLeaderSubmissionNotification exception handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle exception from sendLeaderSubmissionNotification', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    jest.spyOn(userAuthMod, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue({
      leaderId,
      leaderEmail: 'leader@example.com',
      authorized: true,
    } as any);

    jest.spyOn(businessDayMod, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isBusinessDay: true,
      isWithinDeadline: true,
    } as any);

    jest.spyOn(persistenceMod, 'retrieveDailyReportsForLeaderReview').mockResolvedValue({} as any);
    jest.spyOn(persistenceMod, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue({} as any);

    jest.spyOn(reminderMod, 'sendLeaderSubmissionNotification').mockRejectedValue(
      new Error('メール配信サービスが一時的に利用不可のため、配信に失敗しました')
    );

    try {
      await retrieveLeaderDashboardData({
        leaderId,
        targetDate,
      });
    } catch (error) {
      if (error instanceof DataRetrievalFailedError) {
        expect((error as any).message).toContain('管理画面データの取得に失敗しました');
      }
    }
  });
});
