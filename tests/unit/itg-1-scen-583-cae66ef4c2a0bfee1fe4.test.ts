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

describe('SCEN-583: 提出状況サマリーの提出者数、未提出者数、催促済み数が正確に計算される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate submission status summary accurately based on aggregated data', async () => {
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
      {
        reportId: 'report-003',
        reporterId: 'reporter-003',
        reporterName: '佐藤次郎',
        submissionTime: '2024-01-15T12:00:00Z',
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
        reporterId: 'reporter-004',
        reporterName: '田中美咲',
        detectionType: 'non_submitted',
      },
      {
        logId: 'log-002',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T15:30:00Z',
        reporterId: 'reporter-005',
        reporterName: '渡辺健太',
        detectionType: 'non_submitted',
      },
    ];

    const mockNonSubmittedReporters: NonSubmittedReporterInfo[] = [
      {
        reporterId: 'reporter-004',
        reporterName: '田中美咲',
        detectionDateTime: '2024-01-15T15:00:00Z',
      },
      {
        reporterId: 'reporter-005',
        reporterName: '渡辺健太',
        detectionDateTime: '2024-01-15T15:30:00Z',
      },
    ];

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
      {
        historyId: 'history-002',
        recipientId: 'reporter-002',
        recipientEmail: 'reporter002@example.com',
        emailType: 'daily_report_submitted',
        subject: '日報提出のお知らせ',
        sentTime: '2024-01-15T11:00:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'history-003',
        recipientId: 'reporter-003',
        recipientEmail: 'reporter003@example.com',
        emailType: 'daily_report_submitted',
        subject: '日報提出のお知らせ',
        sentTime: '2024-01-15T12:00:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
    ];

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

    expect(result.submittedReports.length).toBe(3);
    expect(result.nonSubmittedReporters.length).toBe(2);
    expect(result.detectionLogs.length).toBe(2);
    expect(result.emailSendingHistory.length).toBe(3);
    expect(result.submissionStatusSummary.submittedCount).toBe(3);
    expect(result.submissionStatusSummary.nonSubmittedCount).toBe(2);
    expect(result.submissionStatusSummary.reminderSentCount).toBe(3);
  });
});
