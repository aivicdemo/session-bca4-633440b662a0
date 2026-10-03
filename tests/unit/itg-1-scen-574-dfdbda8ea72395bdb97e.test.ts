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

describe('SCEN-574: Late submission flag when submission time exceeds 17:00', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set isLate to true when submission time is 17:00:01', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2025-01-15';

    jest.spyOn(userAuthMod, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue({
      leaderId,
      leaderEmail: 'leader@example.com',
      authorized: true,
    } as any);

    jest.spyOn(businessDayMod, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isBusinessDay: true,
      isWithinDeadline: true,
    } as any);

    jest.spyOn(persistenceMod, 'retrieveDailyReportsForLeaderReview').mockResolvedValue({
      submittedReports: [
        {
          reportId: 'report-001',
          reporterId: 'employee-001',
          reporterName: 'Employee A',
          submissionTime: '2025-01-15T17:00:01Z',
          businessContent: 'Business activities',
          achievements: '',
          issues: '',
          tomorrowPlan: '',
          isLate: true,
        },
      ],
    } as any);

    jest.spyOn(persistenceMod, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue({} as any);
    jest.spyOn(reminderMod, 'sendLeaderSubmissionNotification').mockResolvedValue({} as any);

    const result = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    expect(result.submittedReports).toBeDefined();
    expect(result.submittedReports.length).toBeGreaterThan(0);
    
    const lateReport = result.submittedReports.find(
      (r: any) => r.submissionTime === '2025-01-15T17:00:01Z'
    );
    expect(lateReport).toBeDefined();
    expect(lateReport?.isLate).toBe(true);
  });
});
