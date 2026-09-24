import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';
import * as emailHistoryModule from '../../src/logic/user-master-persistence';

describe('SCEN-582: 本日のメール送信履歴が0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信履歴が0件のとき、emailSendingHistoryフィールドが空配列である', async () => {
    const leaderId = 'leader001';
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

    jest.spyOn(reportPersistenceModule, 'retrieveDailyReportsForLeaderReview').mockResolvedValue([
      {
        reportId: 'R-001',
        reporterId: 'E-001',
        reporterName: '山田太郎',
        submissionTime: '2024-01-15T10:30:00Z',
        businessContent: 'テスト日報',
      },
    ]);

    jest.spyOn(reportPersistenceModule, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue([
      {
        detectionLogId: 'DL-001',
        targetDate,
        detectionDateTime: '2024-01-15T09:00:00Z',
        nonSubmittedReporters: [
          {
            userId: 'E-002',
            userName: '田中太郎',
            emailAddress: 'tanaka@example.com',
          },
        ],
      },
    ]);

    jest.spyOn(emailHistoryModule, 'retrieveEmailSendingHistoryByDateRange').mockResolvedValue([]);

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    expect(result.emailSendingHistory).toEqual([]);
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);
    expect(result.submittedReports).toHaveLength(1);
    expect(result.nonSubmittedReporters).toHaveLength(1);
    expect(result.detectionLogs).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();
  });
});
