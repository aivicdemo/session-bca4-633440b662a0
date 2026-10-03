import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-578: 本日の未提出者が0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (userAuthModule.authenticateAndAuthorizeLeaderAccess as jest.Mock<any>).mockResolvedValue({
      isAccessGranted: true,
      userId: 'valid-leader-id',
      denialReason: null,
    });

    (businessDayModule.judgeBusinessDayAndDeadline as jest.Mock<any>).mockResolvedValue({
      isBusinessDay: true,
    });

    (persistenceModule.retrieveDailyReportsForLeaderReview as jest.Mock<any>).mockResolvedValue([
      {
        reportId: 'R-001',
        reporterId: 'E-001',
        reporterName: 'テスト太郎',
        submissionDateTime: '2024-01-15T10:30:00Z',
        reportContent: 'テスト日報',
        reportDate: '2024-01-15',
      },
      {
        reportId: 'R-002',
        reporterId: 'E-002',
        reporterName: 'テスト花子',
        submissionDateTime: '2024-01-15T11:00:00Z',
        reportContent: 'テスト日報2',
        reportDate: '2024-01-15',
      },
    ]);

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([]);

  });

  it('未提出者が0件のとき、nonSubmittedReportersフィールドが空配列である', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'valid-leader-id',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.nonSubmittedReporters).toEqual([]);
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
  });

  it('他のフィールドはスタブの戻り値に従う', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'valid-leader-id',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.detectionLogs).toEqual([]);
    expect(result.submittedReports).toHaveLength(2);
    expect(result.emailSendingHistory).toHaveLength(2);
    expect(result.submissionStatusSummary.nonSubmittedCount).toBe(0);
  });
});
