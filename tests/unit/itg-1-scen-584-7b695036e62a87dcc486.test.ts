import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-584: targetDateがISO 8601形式（YYYY-MM-DD）で正しく指定されたとき、その日付の営業日判定と日報データ取得が行われる', () => {
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

    (persistenceModule.retrieveDailyReportsForLeaderReview as jest.Mock<any>).mockResolvedValue([
      {
        reportId: 'R-001',
        reporterId: 'E-001',
        reporterName: '報告者A',
        submissionDateTime: '2024-01-15T14:30:00Z',
        reportContent: '営業活動',
        reportDate: '2024-01-15',
      },
    ]);

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([
      {
        detectionLogId: 'DL-001',
        targetDate: '2024-01-15',
        detectionTimestamp: 1705329900000,
        nonSubmittedCount: 1,
        logType: 'info',
      },
    ]);

  });

  it('ISO 8601形式の日付で営業日判定と日報データ取得が行われる', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result).toBeDefined();
    expect(result.submittedReports).toBeDefined();
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.nonSubmittedReporters).toBeDefined();
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(result.detectionLogs).toBeDefined();
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(result.emailSendingHistory).toBeDefined();
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);
    expect(result.submissionStatusSummary).toBeDefined();
  });

  it('targetDateが正しく処理される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(businessDayModule.judgeBusinessDayAndDeadline).toHaveBeenCalled();
    expect(persistenceModule.retrieveDailyReportsForLeaderReview).toHaveBeenCalled();
    expect(persistenceModule.retrieveNonSubmissionDetectionLogsByDate).toHaveBeenCalled();
  });
});
