import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-581: 本日のメール送信履歴が複数件存在するとき、すべての送信履歴が配列に集約される', () => {
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
        reporterName: 'テスト太郎',
        submissionDateTime: '2024-01-15T10:30:00Z',
        reportContent: 'テスト日報',
        reportDate: '2024-01-15',
      },
    ]);

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([]);

  });

  it('複数のメール送信履歴がすべて配列に集約される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.emailSendingHistory).toHaveLength(3);
    expect(result.emailSendingHistory[0].emailType).toBe('daily_report_submitted');
    expect(result.emailSendingHistory[0].sendingStatus).toBe('success');
    expect(result.emailSendingHistory[1].emailType).toBe('end_of_day_unsubmitted_list');
    expect(result.emailSendingHistory[1].sendingStatus).toBe('success');
    expect(result.emailSendingHistory[2].emailType).toBe('daily_report_submitted');
    expect(result.emailSendingHistory[2].sendingStatus).toBe('success');
  });
});
