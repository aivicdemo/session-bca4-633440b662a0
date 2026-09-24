import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';
import * as emailHistoryModule from '../../src/logic/user-master-persistence';

describe('SCEN-576: 本日の提出済み日報が0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('本日の提出済み日報が0件のとき、submittedReportsフィールドが空配列である', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    // スタブ設定
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
    ]);

    // 実行
    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData({
      leaderId,
      targetDate,
    });

    // 検証
    expect(result.submittedReports).toEqual([]);
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.submittedReports.length).toBe(0);

    // その他フィールドも存在することを確認
    expect(result).toHaveProperty('nonSubmittedReporters');
    expect(result).toHaveProperty('detectionLogs');
    expect(result).toHaveProperty('emailSendingHistory');
    expect(result).toHaveProperty('submissionStatusSummary');
  });
});
