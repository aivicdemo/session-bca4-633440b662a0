import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
} from '../../src/logic/daily-report-management-view';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-565: Invalid submission time throws error', () => {
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
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('should throw error when submission time is null', async () => {
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([{
      reportId: 'RPT001',
      reporterName: '太郎',
      submissionDateTime: null,
      reportContent: 'テスト報告',
      reportDate: new Date('2024-01-15'),
    }]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    };

    try {
      await retrieveLeaderDashboardData(input);
      throw new Error('Should have thrown error');
    } catch (error) {
      expect((error as Error).message).toContain('提出時刻の記録が不正です');
    }
  });

  it('should throw error when submission time is invalid date object', async () => {
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([{
      reportId: 'RPT002',
      reporterName: '花子',
      submissionDateTime: new Date('invalid-date'),
      reportContent: 'テスト報告',
      reportDate: new Date('2024-01-15'),
    }]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader001',
      targetDate: '2024-01-15',
    };

    try {
      await retrieveLeaderDashboardData(input);
      throw new Error('Should have thrown error');
    } catch (error) {
      expect((error as Error).message).toContain('提出時刻の記録が不正です');
    }
  });
});
