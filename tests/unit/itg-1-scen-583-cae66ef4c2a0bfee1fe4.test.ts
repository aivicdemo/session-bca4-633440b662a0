import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-583: 提出状況サマリーの提出者数、未提出者数、催促済み数が正確に計算される', () => {
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

    // 提出済み日報3件
    (persistenceModule.retrieveDailyReportsForLeaderReview as jest.Mock<any>).mockResolvedValue([
      {
        reportId: 'R001',
        reporterId: 'REP-001',
        reporterName: '太郎',
        submissionDateTime: '2024-01-15T14:30:00Z',
        reportContent: '営業活動',
        reportDate: '2024-01-15',
      },
      {
        reportId: 'R002',
        reporterId: 'REP-002',
        reporterName: '花子',
        submissionDateTime: '2024-01-15T15:00:00Z',
        reportContent: '事務作業',
        reportDate: '2024-01-15',
      },
      {
        reportId: 'R003',
        reporterId: 'REP-003',
        reporterName: '次郎',
        submissionDateTime: '2024-01-15T16:00:00Z',
        reportContent: '会議',
        reportDate: '2024-01-15',
      },
    ]);

    // 未提出者検知ログ2件
    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([
      {
        detectionLogId: 'DL-001',
        targetDate: '2024-01-15',
        detectionTimestamp: 1705329900000,
        nonSubmittedCount: 1,
        logType: 'warn',
      },
      {
        detectionLogId: 'DL-002',
        targetDate: '2024-01-15',
        detectionTimestamp: 1705330000000,
        nonSubmittedCount: 1,
        logType: 'warn',
      },
    ]);

    // メール送信履歴3件
  });

  it('提出状況サマリーが正確に計算される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.submittedReports).toHaveLength(3);
    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.detectionLogs).toHaveLength(2);
    expect(result.emailSendingHistory).toHaveLength(3);

    expect(result.submissionStatusSummary.submittedCount).toBe(3);
    expect(result.submissionStatusSummary.nonSubmittedCount).toBe(2);
    expect(result.submissionStatusSummary.reminderSentCount).toBe(3);
  });
});
