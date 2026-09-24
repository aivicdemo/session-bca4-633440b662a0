import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';
import * as emailHistoryModule from '../../src/logic/user-master-persistence';

describe('SCEN-579: 本日の検知ログが複数件存在するとき、すべての検知ログが配列に集約される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の検知ログがすべて配列に集約される', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    jest.spyOn(authModule, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue({
      leaderId,
      isAuthenticated: true,
      role: 'leader',
    });

    jest.spyOn(businessDayModule, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isBusinessDay: true,
      targetDate,
      deadlineDateTime: '2024-01-15T18:00:00Z',
    });

    jest.spyOn(reportPersistenceModule, 'retrieveDailyReportsForLeaderReview').mockResolvedValue([]);

    jest.spyOn(reportPersistenceModule, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue([
      {
        detectionLogId: 'DL-001',
        targetDate,
        detectionDateTime: '2024-01-15T09:00:00Z',
        nonSubmittedReporters: [{ userId: 'E-001', userName: '山田太郎', emailAddress: 'yamada@example.com' }],
      },
      {
        detectionLogId: 'DL-002',
        targetDate,
        detectionDateTime: '2024-01-15T10:00:00Z',
        nonSubmittedReporters: [{ userId: 'E-002', userName: '田中花子', emailAddress: 'tanaka@example.com' }],
      },
      {
        detectionLogId: 'DL-003',
        targetDate,
        detectionDateTime: '2024-01-15T11:00:00Z',
        nonSubmittedReporters: [{ userId: 'E-003', userName: '佐藤次郎', emailAddress: 'satoh@example.com' }],
      },
    ]);

    jest.spyOn(emailHistoryModule, 'retrieveEmailSendingHistoryByDateRange').mockResolvedValue([]);

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    expect(result.detectionLogs).toHaveLength(3);
    expect(result.submittedReports).toEqual([]);
    expect(result.emailSendingHistory).toEqual([]);
    expect(result.detectionLogs[0]).toHaveProperty('detectionLogId', 'DL-001');
    expect(result.detectionLogs[1]).toHaveProperty('detectionLogId', 'DL-002');
    expect(result.detectionLogs[2]).toHaveProperty('detectionLogId', 'DL-003');
  });
});
