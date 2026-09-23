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

describe('SCEN-579: 本日の検知ログが複数件存在するとき、すべての検知ログが配列に集約される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate multiple detection logs when multiple logs exist', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    const mockSubmittedReports: SubmittedDailyReportSummary[] = [];

    const mockDetectionLogs: DetectionLogSummary[] = [
      {
        logId: 'log-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T15:00:00Z',
        reporterId: 'reporter-001',
        reporterName: '山田太郎',
        detectionType: 'non_submitted',
      },
      {
        logId: 'log-002',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T15:30:00Z',
        reporterId: 'reporter-002',
        reporterName: '鈴木花子',
        detectionType: 'non_submitted',
      },
      {
        logId: 'log-003',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T16:00:00Z',
        reporterId: 'reporter-003',
        reporterName: '佐藤次郎',
        detectionType: 'non_submitted',
      },
    ];

    const mockNonSubmittedReporters: NonSubmittedReporterInfo[] = [
      {
        reporterId: 'reporter-001',
        reporterName: '山田太郎',
        detectionDateTime: '2024-01-15T15:00:00Z',
      },
      {
        reporterId: 'reporter-002',
        reporterName: '鈴木花子',
        detectionDateTime: '2024-01-15T15:30:00Z',
      },
      {
        reporterId: 'reporter-003',
        reporterName: '佐藤次郎',
        detectionDateTime: '2024-01-15T16:00:00Z',
      },
    ];

    const mockEmailHistory: EmailHistorySummary[] = [];

    const mockSubmissionStatusSummary: SubmissionStatusSummary = {
      totalReporters: 3,
      submittedCount: 0,
      nonSubmittedCount: 3,
      reminderSentCount: 0,
      submissionRate: 0,
    };

    jest.spyOn(userAuth, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue(undefined);
    jest.spyOn(businessDayJudge, 'judgeBusinessDayAndDeadline').mockResolvedValue(undefined);
    jest.spyOn(dailyReportPersistence, 'retrieveDailyReportsForLeaderReview').mockResolvedValue(mockSubmittedReports);
    jest.spyOn(dailyReportPersistence, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue(mockDetectionLogs);
    jest.spyOn(userMasterPersistence, 'retrieveEmailSendingHistoryByDateRange').mockResolvedValue(mockEmailHistory);

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId,
      targetDate,
    };

    const result: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(result.detectionLogs.length).toBe(3);
    expect(result.detectionLogs).toEqual(mockDetectionLogs);
    expect(result.submittedReports).toEqual([]);
    expect(result.nonSubmittedReporters).toEqual(mockNonSubmittedReporters);
    expect(result.emailSendingHistory).toEqual([]);
  });
});
