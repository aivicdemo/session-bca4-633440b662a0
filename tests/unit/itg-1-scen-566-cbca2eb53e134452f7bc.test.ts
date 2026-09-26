import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/daily-report-reminder-notification');

import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';
import type {
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';

describe('SCEN-566: 提出済み日報の報告者名が登録されていない場合、警告が記録される', () => {
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
      reporterName: null,
      submissionTime: '2024-01-15T14:30:00',
      businessContent: '本日の業務内容',
      achievements: '達成事項',
      issues: '課題',
      tomorrowPlan: '明日の計画',
    }]);
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
  });

  it('reporterName が null または空文字列の日報がある場合、detectionLogs に検知記録が存在する', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(output).toBeDefined();
    expect(output.detectionLogs).toBeDefined();
    expect(Array.isArray(output.detectionLogs)).toBe(true);

    expect(output.submittedReports).toHaveLength(1);
    expect(output.submittedReports[0].reportId).toBe('report-001');
    expect(output.nonSubmittedReporters).toEqual([]);
    expect(output.emailSendingHistory).toEqual([]);
  });
});
