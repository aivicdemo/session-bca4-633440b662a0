import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-580: 本日の検知ログが0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (userAuthModule.authenticateAndAuthorizeLeaderAccess as jest.Mock<any>).mockResolvedValue({
      isAccessGranted: true,
      userId: 'leader001',
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
    ]);

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([]);

  });

  it('検知ログが0件のとき、detectionLogsフィールドが空配列である', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.detectionLogs).toEqual([]);
    expect(Array.isArray(result.detectionLogs)).toBe(true);
  });

  it('他のフィールドはスタブの戻り値に従う', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.submittedReports).toHaveLength(1);
    expect(result.emailSendingHistory).toHaveLength(2);
    expect(result.submissionStatusSummary).toBeDefined();
  });
});
