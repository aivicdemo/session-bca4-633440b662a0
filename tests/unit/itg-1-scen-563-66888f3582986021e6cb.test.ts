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

describe('SCEN-563: Format daily report with proper date/time and late flag', () => {
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

    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ leaderId: 'LEADER001', isAuthorized: true });
    mockJudgeBusinessDayAndDeadline.mockResolvedValue(true);
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([{
      reportId: 'RPT001',
      reporterName: '田中太郎',
      submissionDateTime: new Date('2024-01-15T16:45:00'),
      reportContent: '本日の業務内容テスト',
      reportDate: new Date('2024-01-15'),
    }]);
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('should format daily report with proper date, time, and isLate flag', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'LEADER001',
      targetDate: '2024-01-15',
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(output.submittedReports).toHaveLength(1);
    const report = output.submittedReports[0];

    expect(report.displayDate).toBe('2024年01月15日（月）');
    expect(report.displayReporterName).toBe('田中太郎');
    expect(report.displaySubmissionTime).toBe('16:45');
    expect(report.displayContent).toBe('本日の業務内容テスト');
    expect(report.isLate).toBe(false);
  });
});
