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

describe('SCEN-578: 本日の未提出者が0件のとき、空の配列が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty nonSubmittedReporters array when there are 0 non-submitted reporters', async () => {
    const leaderId = 'valid-leader-id';
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
      {
        reportId: 'report-002',
        reporterId: 'reporter-002',
        reporterName: '鈴木花子',
        submissionTime: '2024-01-15T11:00:00Z',
        businessContent: '業務内容のサンプル',
        achievements: '成果のサンプル',
        issues: '課題のサンプル',
        tomorrowPlan: '明日の計画のサンプル',
      },
    ];

    const mockDetectionLogs: DetectionLogSummary[] = [];

    const mockEmailHistory: EmailHistorySummary[] = [
      {
        historyId: 'history-001',
        recipientId: 'reporter-001',
        recipientEmail: 'reporter001@example.com',
        emailType: 'daily_report_submitted',
        subject: '日報提出のお知らせ',
        sentTime: '2024-01-15T10:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
    ];

    const mockSubmissionStatusSummary: SubmissionStatusSummary = {
      totalReporters: 2,
      submittedCount: 2,
      nonSubmittedCount: 0,
      reminderSentCount: 0,
      submissionRate: 100,
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

    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.nonSubmittedReporters.length).toBe(0);
    expect(result.submittedReports).toEqual(mockSubmittedReports);
    expect(result.detectionLogs).toEqual([]);
    expect(result.emailSendingHistory).toEqual(mockEmailHistory);
    expect(result.submissionStatusSummary.nonSubmittedCount).toBe(0);
  });
});
