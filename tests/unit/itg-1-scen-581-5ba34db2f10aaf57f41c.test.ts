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

describe('SCEN-581: 本日のメール送信履歴が複数件存在するとき、すべての送信履歴が配列に集約される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate multiple email sending history entries when multiple records exist', async () => {
    const leaderId = 'leader-001';
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
        emailType: 'end_of_day_unsubmitted_list',
        subject: '未提出者リストのお知らせ',
        sentTime: '2024-01-15T17:00:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'history-003',
        recipientId: 'reporter-003',
        recipientEmail: 'reporter003@example.com',
        emailType: 'daily_report_submitted',
        subject: '日報提出のお知らせ',
        sentTime: '2024-01-15T11:00:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
    ];

    const mockSubmissionStatusSummary: SubmissionStatusSummary = {
      totalReporters: 3,
      submittedCount: 1,
      nonSubmittedCount: 2,
      reminderSentCount: 3,
      submissionRate: 33,
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

    expect(result.emailSendingHistory.length).toBe(3);
    expect(result.emailSendingHistory[0].emailType).toBe('daily_report_submitted');
    expect(result.emailSendingHistory[0].sendingStatus).toBe('success');
    expect(result.emailSendingHistory[1].emailType).toBe('end_of_day_unsubmitted_list');
    expect(result.emailSendingHistory[1].sendingStatus).toBe('success');
    expect(result.emailSendingHistory[2].emailType).toBe('daily_report_submitted');
    expect(result.emailSendingHistory[2].sendingStatus).toBe('success');
    expect(result.emailSendingHistory).toEqual(mockEmailHistory);
  });
});
