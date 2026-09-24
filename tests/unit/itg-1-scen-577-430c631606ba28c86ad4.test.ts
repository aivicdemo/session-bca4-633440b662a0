import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';
import * as emailHistoryModule from '../../src/logic/user-master-persistence';

describe('SCEN-577: 本日の未提出者が複数件存在するとき、すべての未提出者情報が配列に集約される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の未提出者情報がすべて配列に集約される', async () => {
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
          {
            userId: 'E-003',
            userName: '佐藤花子',
            emailAddress: 'satoh@example.com',
          },
          {
            userId: 'E-004',
            userName: '鈴木次郎',
            emailAddress: 'suzuki@example.com',
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

    expect(result.nonSubmittedReporters).toHaveLength(3);
    expect(result.nonSubmittedReporters[0]).toMatchObject({
      userId: 'E-002',
      userName: '田中太郎',
    });
    expect(result.nonSubmittedReporters[1]).toMatchObject({
      userId: 'E-003',
      userName: '佐藤花子',
    });
    expect(result.nonSubmittedReporters[2]).toMatchObject({
      userId: 'E-004',
      userName: '鈴木次郎',
    });
    expect(result.submissionStatusSummary).toHaveProperty('submittedCount', 1);
    expect(result.submissionStatusSummary).toHaveProperty('nonSubmittedCount', 3);
  });
});
