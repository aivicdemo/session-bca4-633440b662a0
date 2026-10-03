import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-576: 本日の提出済み日報が0件のとき、空の配列が返される', () => {
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

    (persistenceModule.retrieveDailyReportsForLeaderReview as jest.Mock<any>).mockResolvedValue([]);

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([
      {
        detectionLogId: 'DL-001',
        userId: 'user-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T18:05:00Z',
        reminderSent: false,
        reminderSentDateTime: null,
        submissionStatus: 'not_submitted',
      },
    ]);
  });

  it('本日の提出済み日報が0件のとき、submittedReportsフィールドが空配列である', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.submittedReports).toEqual([]);
    expect(Array.isArray(result.submittedReports)).toBe(true);
    expect(result.submittedReports.length).toBe(0);
  });

  it('他のフィールドはスタブの戻り値に従う', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result).toHaveProperty('nonSubmittedReporters');
    expect(result).toHaveProperty('detectionLogs');
    expect(result).toHaveProperty('emailSendingHistory');
    expect(result).toHaveProperty('submissionStatusSummary');
    expect(Array.isArray(result.nonSubmittedReporters)).toBe(true);
    expect(Array.isArray(result.detectionLogs)).toBe(true);
    expect(Array.isArray(result.emailSendingHistory)).toBe(true);
  });
});
