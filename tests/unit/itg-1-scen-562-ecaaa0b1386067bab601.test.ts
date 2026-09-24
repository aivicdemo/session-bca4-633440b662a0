import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  DataRetrievalFailedError,
  RetrieveLeaderDashboardDataInput,
} from '../../src/logic/daily-report-management-view';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-562: Data retrieval failed', () => {
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
    mockRetrieveDailyReportsForLeaderReview.mockRejectedValue(new DataRetrievalFailedError());
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('should throw DataRetrievalFailedError when daily reports retrieval fails', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2025-01-15',
    };

    try {
      await retrieveLeaderDashboardData(input);
      throw new Error('Should have thrown DataRetrievalFailedError');
    } catch (error) {
      expect(error).toBeInstanceOf(DataRetrievalFailedError);
      expect((error as DataRetrievalFailedError).message).toBe('管理画面データの取得に失敗しました。');
    }
  });
});
