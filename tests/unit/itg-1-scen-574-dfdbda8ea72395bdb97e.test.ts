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

describe('SCEN-574: Edge case - submission time 17:00:01 sets isLate to true', () => {
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

    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ leaderId: 'leader-001', isAuthorized: true });
    mockJudgeBusinessDayAndDeadline.mockResolvedValue(true);
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([{
      reportId: 'report-001',
      reporterName: '太郎',
      submissionDateTime: new Date('2025-01-15T17:00:01'),
      reportContent: 'テスト報告',
      reportDate: new Date('2025-01-15'),
    }]);
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('should set isLate to true when submission time is 17:00:01', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2025-01-15',
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(output.submittedReports).toHaveLength(1);
    expect(output.submittedReports[0].isLate).toBe(true);
  });
});
