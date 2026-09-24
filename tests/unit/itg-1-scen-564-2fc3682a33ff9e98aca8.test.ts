import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
} from '../../src/logic/daily-report-management-view';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-564: Empty or null report content triggers error', () => {
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
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('should throw error when report content is empty string', async () => {
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([{
      reportId: 'RPT001',
      reporterName: '太郎',
      submissionDateTime: new Date('2024-01-15T14:30:00'),
      reportContent: '',
      reportDate: new Date('2024-01-15'),
    }]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    try {
      await retrieveLeaderDashboardData(input);
      throw new Error('Should have thrown error');
    } catch (error) {
      expect((error as Error).message).toContain('日報内容が記録されていません');
    }
  });

  it('should throw error when report content is null', async () => {
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([{
      reportId: 'RPT002',
      reporterName: '花子',
      submissionDateTime: new Date('2024-01-15T14:30:00'),
      reportContent: null,
      reportDate: new Date('2024-01-15'),
    }]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    try {
      await retrieveLeaderDashboardData(input);
      throw new Error('Should have thrown error');
    } catch (error) {
      expect((error as Error).message).toContain('日報内容が記録されていません');
    }
  });
});
