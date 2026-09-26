import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  DataRetrievalFailedError,
} from '../../src/logic/daily-report-management-view';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-573: ダッシュボード取得時にvalidateAndDeliverLeaderNotification処理で例外が発生した場合', () => {
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
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({ isBusinessDay: true });
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([{
      reportId: 'report-001',
      reporterName: '太郎',
      submissionDateTime: '2024-01-15T14:30:00Z',
      reportContent: '本日の業務',
      reportDate: '2024-01-15',
    }]);
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('validateAndDeliverLeaderNotification例外発生時、DataRetrievalFailedErrorをスロー', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    try {
      const output = await retrieveLeaderDashboardData(input);
      expect(output.submittedReports).toBeDefined();
      expect(output.nonSubmittedReporters).toBeDefined();
      expect(output.detectionLogs).toBeDefined();
      expect(output.emailSendingHistory).toBeDefined();
      expect(output.submissionStatusSummary).toBeDefined();
    } catch (error) {
      expect(error).toBeInstanceOf(DataRetrievalFailedError);
      expect((error as any).message).toBe('管理画面データの取得に失敗しました。');
    }
  });

  it('TargetDateInvalidErrorは発生しないこと', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    try {
      await retrieveLeaderDashboardData(input);
    } catch (error) {
      expect((error as any).constructor.name).not.toBe('TargetDateInvalidError');
    }
  });
});
