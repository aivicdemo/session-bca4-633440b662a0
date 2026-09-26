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

describe('SCEN-572: ダッシュボード取得時にformatDailyReportDisplay処理で例外が発生した場合', () => {
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
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('formatDailyReportDisplay処理内で例外が発生した場合、DataRetrievalFailedErrorをスロー', async () => {
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([
      {
        reportId: 'report-001',
        reporterName: '太郎',
        submissionDateTime: null,
        reportContent: null,
        reportDate: '2025-01-15',
      },
      {
        reportId: 'report-002',
        reporterName: '花子',
        submissionDateTime: '2025-01-15T14:30:00Z',
        reportContent: '営業先訪問',
        reportDate: '2025-01-15',
      },
      {
        reportId: 'report-003',
        reporterName: '次郎',
        submissionDateTime: '2025-01-15T16:45:00Z',
        reportContent: '資料作成',
        reportDate: '2025-01-15',
      },
    ]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2025-01-15',
    };

    try {
      await retrieveLeaderDashboardData(input);
      throw new Error('Should have thrown DataRetrievalFailedError');
    } catch (error) {
      expect(error).toBeInstanceOf(DataRetrievalFailedError);
      expect((error as any).message).toBe('管理画面データの取得に失敗しました。');
    }
  });

  it('リーダー認可は正常に完了していること', async () => {
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([]);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2025-01-15',
    };

    try {
      await retrieveLeaderDashboardData(input);
    } catch (error) {
      expect(error).not.toBeInstanceOf(Error);
    }

    expect(mockAuthenticateAndAuthorizeLeaderAccess).toHaveBeenCalled();
  });
});
