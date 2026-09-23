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

describe('SCEN-582: 本日のメール送信履歴が0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty emailSendingHistory array when there are 0 email records', async () => {
    const leaderId = 'leader001';
    const targetDate = '2024-01-15';

    const mockSubmittedReports: SubmittedDailyReportSummary[] = [
      {
        reportId: 'report-001',
        reporterId: 'reporter-001',
        reporterName: '山田太郎',
        submissionTime: '2024-01-15T10:30:00Z',
        businessContent: '業務内容のサンプル',
        achievements: '成果のサンプル',
        issues: '課題のサンプル',
        tomorrowPlan: '明日の計画のサンプル',
      },
    ];

    const mockDetectionLogs: DetectionLogSummary[] = [
      {
        logId: 'log-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T15:00:00Z',
        reporterId: 'reporter-002',
        reporterName: '鈴木花子',
        detectionType: 'non_submitted',
      },
    ];

    const mockNonSubmittedReporters: NonSubmittedReporterInfo[] = [
      {
        reporterId: 'reporter-002',
        reporterName: '鈴木花子',
        detectionDateTime: '2024-01-15T15:00:00Z',
      },
    ];

    const mockEmailHistory: EmailHistorySummary[] = [];

    const mockSubmissionStatusSummary: SubmissionStatusSummary = {
      totalReporters: 2,
      submittedCount: 1,
      nonSubmittedCount: 1,
      reminderSentCount: 0,
      submissionRate: 50,
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

    expect(result.emailSendingHistory).toEqual([]);
    expect(result.emailSendingHistory.length).toBe(0);
    expect(result.submittedReports).toEqual(mockSubmittedReports);
    expect(result.detectionLogs).toEqual(mockDetectionLogs);
    expect(result.nonSubmittedReporters).toEqual(mockNonSubmittedReporters);
  });
});
