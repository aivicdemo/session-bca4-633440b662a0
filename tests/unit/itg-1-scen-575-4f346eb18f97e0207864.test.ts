import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';


describe('SCEN-575: 提出済み日報が複数件存在するとき、すべての日報が統一フォーマットで配列に集約される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (userAuthModule.authenticateAndAuthorizeLeaderAccess as jest.Mock<any>).mockResolvedValue({ leaderId: 'leader001', isAuthorized: true });
    (businessDayModule.judgeBusinessDayAndDeadline as jest.Mock<any>).mockResolvedValue({ isBusinessDay: true });
    (persistenceModule.retrieveDailyReportsForLeaderReview as jest.Mock<any>).mockResolvedValue([
      {
        reportId: 'report001',
        reporterId: 'reporter-001',
        reporterName: '太郎',
        submissionDateTime: '2025-01-15T14:30:00Z',
        reportContent: '営業先A訪問、契約成立',
        reportDate: '2025-01-15',
      },
      {
        reportId: 'report002',
        reporterId: 'reporter-002',
        reporterName: '花子',
        submissionDateTime: '2025-01-15T16:45:00Z',
        reportContent: '提案資料作成、次週プレゼン予定',
        reportDate: '2025-01-15',
      },
      {
        reportId: 'report003',
        reporterId: 'reporter-003',
        reporterName: '次郎',
        submissionDateTime: '2025-01-15T17:30:00Z',
        reportContent: '定例会議参加、予算承認取得',
        reportDate: '2025-01-15',
      },
    ]);
    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock<any>).mockResolvedValue([]);
  });

  it('複数件の日報が統一フォーマットで配列に集約される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2025-01-15',
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(output.submittedReports).toHaveLength(3);
    expect(Array.isArray(output.submittedReports)).toBe(true);

    expect(output.submittedReports[0]).toBeDefined();
    expect(output.submittedReports[0].reportId).toBe('report001');
    expect(output.submittedReports[0].reporterName).toBe('太郎');
    expect(output.submittedReports[0].displaySubmissionTime).toBe('14:30');
    expect(output.submittedReports[0].displayContent).toBe('営業先A訪問、契約成立');
    expect(output.submittedReports[0].isLate).toBe(false);
    expect(output.submittedReports[0].displayDate).toContain('2025年01月15日');

    expect(output.submittedReports[1]).toBeDefined();
    expect(output.submittedReports[1].reportId).toBe('report002');
    expect(output.submittedReports[1].reporterName).toBe('花子');
    expect(output.submittedReports[1].displaySubmissionTime).toBe('16:45');
    expect(output.submittedReports[1].displayContent).toBe('提案資料作成、次週プレゼン予定');
    expect(output.submittedReports[1].isLate).toBe(false);

    expect(output.submittedReports[2]).toBeDefined();
    expect(output.submittedReports[2].reportId).toBe('report003');
    expect(output.submittedReports[2].reporterName).toBe('次郎');
    expect(output.submittedReports[2].displaySubmissionTime).toBe('17:30');
    expect(output.submittedReports[2].displayContent).toBe('定例会議参加、予算承認取得');
    expect(output.submittedReports[2].isLate).toBe(true);
  });

  it('すべてのレコードが同一スキーマで返される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2025-01-15',
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    output.submittedReports.forEach(report => {
      expect(report.reportId).toBeDefined();
      expect(report.reporterId).toBeDefined();
      expect(report.reporterName).toBeDefined();
      expect(report.displaySubmissionTime).toBeDefined();
      expect(report.displayContent).toBeDefined();
      expect(report.isLate).toBeDefined();
      expect(report.displayDate).toBeDefined();
    });
  });

  it('他のフィールドも返される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2025-01-15',
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(output.nonSubmittedReporters).toBeDefined();
    expect(Array.isArray(output.nonSubmittedReporters)).toBe(true);
    expect(output.detectionLogs).toBeDefined();
    expect(Array.isArray(output.detectionLogs)).toBe(true);
    expect(output.emailSendingHistory).toBeDefined();
    expect(Array.isArray(output.emailSendingHistory)).toBe(true);
    expect(output.submissionStatusSummary).toBeDefined();
  });
});
