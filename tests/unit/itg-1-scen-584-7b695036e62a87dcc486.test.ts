import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';
import * as emailHistoryModule from '../../src/logic/user-master-persistence';

describe('SCEN-584: targetDateがISO 8601形式で正しく指定されたとき、その日付の営業日判定と日報データ取得が行われる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ISO 8601形式の日付で営業日判定と日報データ取得が正常に行われる', async () => {
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

    jest.spyOn(emailHistoryModule, 'retrieveEmailSendingHistoryByDateRange').mockResolvedValue([
      {
        emailHistoryId: 'EH-001',
        notificationType: 'daily_report_submitted',
        deliveryStatus: 'success',
        sentDateTime: '2024-01-15T09:30:00Z',
      },
    ]);

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    expect(result.submittedReports).toBeDefined();
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.nonSubmittedReporters).toBeDefined();
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(result.detectionLogs).toBeDefined();
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(result.emailSendingHistory).toBeDefined();
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.submissionStatusSummary).toHaveProperty('submittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('nonSubmittedCount');
    expect(result.submissionStatusSummary).toHaveProperty('promptedCount');
  });
});
