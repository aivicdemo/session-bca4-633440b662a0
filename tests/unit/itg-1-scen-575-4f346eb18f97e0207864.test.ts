import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-575: Multiple reports aggregated in unified format', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: any;
  let mockJudgeBusinessDayAndDeadline: any;
  let mockRetrieveDailyReportsForLeaderReview: any;
  let mockRetrieveNonSubmissionDetectionLogsByDate: any;
  let mockRetrieveEmailSendingHistoryByDateRange: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAndAuthorizeLeaderAccess = require('../../src/logic/user-authentication-authorization').authenticateAndAuthorizeLeaderAccess;
    mockJudgeBusinessDayAndDeadline = require('../../src/logic/business-day-deadline-judgment').judgeBusinessDayAndDeadline;
    mockRetrieveDailyReportsForLeaderReview = require('../../src/logic/daily-report-persistence').retrieveDailyReportsForLeaderReview;
    mockRetrieveNonSubmissionDetectionLogsByDate = require('../../src/logic/daily-report-persistence').retrieveNonSubmissionDetectionLogsByDate;
    mockRetrieveEmailSendingHistoryByDateRange = require('../../src/logic/user-master-persistence').retrieveEmailSendingHistoryByDateRange;

    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ leaderId: 'leader001', isAuthorized: true });
    mockJudgeBusinessDayAndDeadline.mockResolvedValue(true);
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([
      {
        reportId: 'report001',
        reporterName: '太郎',
        submissionDateTime: new Date('2025-01-15T14:30:00Z'),
        reportContent: '営業先A訪問、契約成立',
        reportDate: new Date('2025-01-15'),
      },
      {
        reportId: 'report002',
        reporterName: '花子',
        submissionDateTime: new Date('2025-01-15T16:45:00Z'),
        reportContent: '提案資料作成、次週プレゼン予定',
        reportDate: new Date('2025-01-15'),
      },
      {
        reportId: 'report003',
        reporterName: '次郎',
        submissionDateTime: new Date('2025-01-15T17:30:00Z'),
        reportContent: '定例会議参加、予算承認取得',
        reportDate: new Date('2025-01-15'),
      },
    ]);
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('should aggregate multiple reports in unified format', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2025-01-15',
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(output.submittedReports).toHaveLength(3);

    expect(output.submittedReports[0].displayDate).toBe('2025年01月15日(水)');
    expect(output.submittedReports[0].displayReporterName).toBe('太郎');
    expect(output.submittedReports[0].displaySubmissionTime).toBe('14:30');
    expect(output.submittedReports[0].isLate).toBe(false);

    expect(output.submittedReports[1].displayReporterName).toBe('花子');
    expect(output.submittedReports[1].displaySubmissionTime).toBe('16:45');
    expect(output.submittedReports[1].isLate).toBe(false);

    expect(output.submittedReports[2].displayReporterName).toBe('次郎');
    expect(output.submittedReports[2].displaySubmissionTime).toBe('17:30');
    expect(output.submittedReports[2].isLate).toBe(true);

    expect(output.nonSubmittedReporters).toEqual([]);
    expect(output.detectionLogs).toEqual([]);
    expect(output.emailSendingHistory).toEqual([]);
    expect(output.submissionStatusSummary).toBeDefined();
  });
});
