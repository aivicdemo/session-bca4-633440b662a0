import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/daily-report-reminder-notification');

import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';
import type { RetrieveLeaderDashboardDataInput, RetrieveLeaderDashboardDataOutput } from '../../src/logic/daily-report-management-view';

describe('SCEN-567: リーダーメールアドレスが登録され形式が正しく有効化されていれば配信が成功する', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: any;
  let mockJudgeBusinessDayAndDeadline: any;
  let mockRetrieveDailyReportsForLeaderReview: any;
  let mockRetrieveNonSubmissionDetectionLogsByDate: any;
  let mockRetrieveEmailSendingHistoryByDateRange: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const authModule = require('../../src/logic/user-authentication-authorization');
    const judgmentModule = require('../../src/logic/business-day-deadline-judgment');
    const persistenceModule = require('../../src/logic/daily-report-persistence');
    const detectionModule = require('../../src/logic/daily-report-non-submission-detection');
    const notificationModule = require('../../src/logic/daily-report-reminder-notification');

    mockAuthenticateAndAuthorizeLeaderAccess = authModule.authenticateAndAuthorizeLeaderAccess;
    mockJudgeBusinessDayAndDeadline = judgmentModule.judgeBusinessDayAndDeadline;
    mockRetrieveDailyReportsForLeaderReview = persistenceModule.retrieveDailyReportsForLeaderReview;
    mockRetrieveNonSubmissionDetectionLogsByDate = detectionModule.retrieveNonSubmissionDetectionLogsByDate;
    mockRetrieveEmailSendingHistoryByDateRange = notificationModule.retrieveEmailSendingHistoryByDateRange;

    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ leaderId: 'leader-001', isAuthorized: true });
    mockJudgeBusinessDayAndDeadline.mockResolvedValue(true);
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([{
      reportId: 'report-001',
      reporterId: 'reporter-001',
      reporterName: '報告者A',
      submissionTime: '2024-01-15T14:30:00',
      businessContent: '本日の業務完了',
      achievements: '達成事項',
      issues: '課題',
      tomorrowPlan: '明日の計画',
    }]);
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([{
      historyId: 'hist-001',
      recipientId: 'leader-001',
      recipientEmail: 'leader@example.com',
      emailType: 'daily_report_submitted',
      subject: '本日の業務完了',
      sentTime: '2024-01-15T14:30:00',
      sendingStatus: 'sent',
      errorMessage: null,
    }]);
  });

  it('メールアドレスが登録され形式が正しく有効化されていれば、ダッシュボードデータが正常に返される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(output).toBeDefined();
    expect(output.submittedReports).toHaveLength(1);
    expect(output.submittedReports[0].reporterName).toBe('報告者A');
    expect(output.emailSendingHistory).toHaveLength(1);
    expect(output.emailSendingHistory[0].sendingStatus).toBe('sent');
  });
});
