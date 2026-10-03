import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-582: 本日のメール送信履歴が0件のとき、空の配列が返される', () => {
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
        reportId: 'report001',
        reporterId: 'reporter-001',
        reporterName: '太郎',
        submissionDateTime: '2024-01-15T14:30:00Z',
        reportContent: '営業先A訪問、契約成立',
        reportDate: '2024-01-15',
      },
    ]);

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([
      {
        detectionLogId: 'DL-001',
        targetDate: '2024-01-15',
        detectionTimestamp: 1705329900000,
        nonSubmittedCount: 2,
        logType: 'warn',
      },
    ]);
  });

  it('メール送信履歴が0件のとき、emailSendingHistoryフィールドが空配列である', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.emailSendingHistory).toHaveLength(0);
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);
    expect(result.submittedReports).toHaveLength(1);
  });
});
