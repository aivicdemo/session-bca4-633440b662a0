import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';
import * as emailHistoryModule from '../../src/logic/user-master-persistence';

describe('SCEN-580: 本日の検知ログが0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検知ログが0件のとき、detectionLogsフィールドが空配列である', async () => {
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
        nonSubmittedReporters: [],
      },
    ]);

    jest.spyOn(emailHistoryModule, 'retrieveEmailSendingHistoryByDateRange').mockResolvedValue([
      {
        emailHistoryId: 'EH-001',
        notificationType: 'daily_report_submitted',
        deliveryStatus: 'success',
        sentDateTime: '2024-01-15T09:30:00Z',
      },
      {
        emailHistoryId: 'EH-002',
        notificationType: 'end_of_day_unsubmitted_list',
        deliveryStatus: 'success',
        sentDateTime: '2024-01-15T18:30:00Z',
      },
    ]);

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    expect(result.detectionLogs).toEqual([]);
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(result.submittedReports).toHaveLength(1);
    expect(result.emailSendingHistory).toHaveLength(2);
    expect(result.submissionStatusSummary).toBeDefined();
  });
});
