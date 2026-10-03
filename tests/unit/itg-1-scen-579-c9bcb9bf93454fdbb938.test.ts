import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-579: 本日の検知ログが複数件存在するとき、すべての検知ログが配列に集約される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (userAuthModule.authenticateAndAuthorizeLeaderAccess as jest.Mock<any>).mockResolvedValue({
      isAccessGranted: true,
      userId: 'leader-001',
      denialReason: null,
    });

    (businessDayModule.judgeBusinessDayAndDeadline as jest.Mock<any>).mockResolvedValue({
      isBusinessDay: true,
    });

    (persistenceModule.retrieveDailyReportsForLeaderReview as jest.Mock<any>).mockResolvedValue([]);

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([
      {
        detectionLogId: 'DL-001',
        targetDate: '2024-01-15',
        detectionTimestamp: 1705329900000,
        nonSubmittedCount: 1,
        logType: 'warn',
      },
      {
        detectionLogId: 'DL-002',
        targetDate: '2024-01-15',
        detectionTimestamp: 1705329900000,
        nonSubmittedCount: 1,
        logType: 'warn',
      },
      {
        detectionLogId: 'DL-003',
        targetDate: '2024-01-15',
        detectionTimestamp: 1705329900000,
        nonSubmittedCount: 1,
        logType: 'warn',
      },
    ]);
  });

  it('検知ログが3件すべて配列に集約される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.detectionLogs).toHaveLength(3);
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(result.submittedReports).toHaveLength(0);
  });
});
