import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-577: 本日の未提出者が複数件存在するとき、すべての未提出者情報が配列に集約される', () => {
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
        submissionDateTime: '2024-01-15T10:30:00Z',
        reportContent: 'テスト日報',
        reportDate: '2024-01-15',
      },
    ]);

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([
      {
        detectionLogId: 'DL-001',
        userId: 'E-002',
        userName: '田中太郎',
        emailAddress: 'tanaka@example.com',
        department: '営業部',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T18:05:00Z',
        reminderSent: false,
        reminderSentDateTime: null,
        submissionStatus: 'not_submitted',
      },
      {
        detectionLogId: 'DL-002',
        userId: 'E-003',
        userName: '佐藤花子',
        emailAddress: 'sato@example.com',
        department: '営業部',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T18:05:00Z',
        reminderSent: false,
        reminderSentDateTime: null,
        submissionStatus: 'not_submitted',
      },
      {
        detectionLogId: 'DL-003',
        userId: 'E-004',
        userName: '鈴木次郎',
        emailAddress: 'suzuki@example.com',
        department: '営業部',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T18:05:00Z',
        reminderSent: false,
        reminderSentDateTime: null,
        submissionStatus: 'not_submitted',
      },
    ]);
  });

  it('複数の未提出者情報がすべて配列に集約される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.nonSubmittedReporters).toHaveLength(3);
    expect(result.submittedReports).toHaveLength(1);
    expect(result.submissionStatusSummary.submittedCount).toBe(1);
    expect(result.submissionStatusSummary.nonSubmittedCount).toBe(3);
  });

  it('未提出者情報がすべて含まれている', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    const userNames = result.nonSubmittedReporters.map(r => r.userName || (r as any).reporterName);
    expect(userNames).toContain('田中太郎');
    expect(userNames).toContain('佐藤花子');
    expect(userNames).toContain('鈴木次郎');
  });
});
