import { jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
  SubmittedDailyReportSummary,
  EmailHistorySummary,
  SubmissionStatusSummary,
} from '../../src/logic/daily-report-management-view';
import * as userAuth from '../../src/logic/user-authentication-authorization';
import * as businessDayJudge from '../../src/logic/business-day-deadline-judgment';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

type NonSubmittedReporterInfo = any;
type DetectionLogSummary = any;

describe('SCEN-584: targetDateがISO 8601形式（YYYY-MM-DD）で正しく指定されたとき、その日付の営業日判定と日報データ取得が行われる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process ISO 8601 formatted targetDate correctly for business day judgment and data retrieval', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    const mockSubmittedReports: SubmittedDailyReportSummary[] = [];

    const mockDetectionLogs: DetectionLogSummary[] = [];

    const mockNonSubmittedReporters: NonSubmittedReporterInfo[] = [];

    const mockEmailHistory: EmailHistorySummary[] = [];

    const mockSubmissionStatusSummary: SubmissionStatusSummary = {
      totalReporters: 0,
      submittedCount: 0,
      nonSubmittedCount: 0,
      reminderSentCount: 0,
      submissionRate: 0,
    };

    const mockAuthSpy = jest.spyOn(userAuth, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue(undefined);
    const mockBusinessDaySpy = jest.spyOn(businessDayJudge, 'judgeBusinessDayAndDeadline').mockResolvedValue(undefined);
    const mockRetrieveReportsSpy = jest.spyOn(dailyReportPersistence, 'retrieveDailyReportsForLeaderReview').mockResolvedValue(mockSubmittedReports);
    const mockDetectionLogsSpy = jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue(mockDetectionLogs);
    const mockEmailHistorySpy = jest.spyOn(userMasterPersistence, 'retrieveEmailSendingHistoryByDateRange').mockResolvedValue(mockEmailHistory);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId,
      targetDate,
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(mockAuthSpy).toHaveBeenCalledWith(leaderId);
    expect(mockBusinessDaySpy).toHaveBeenCalledWith(targetDate);
    expect(mockRetrieveReportsSpy).toHaveBeenCalledWith(leaderId, targetDate);
    expect(mockDetectionLogsSpy).toHaveBeenCalledWith(leaderId, targetDate);
    expect(mockEmailHistorySpy).toHaveBeenCalledWith(leaderId, targetDate, targetDate);

    expect(result.submittedReports).toEqual([]);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.detectionLogs).toEqual([]);
    expect(result.emailSendingHistory).toEqual([]);
    expect(result.submissionStatusSummary).toBeDefined();
  });
});
