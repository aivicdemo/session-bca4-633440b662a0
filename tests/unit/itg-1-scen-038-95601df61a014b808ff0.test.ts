import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reporter-master-management')>('../../src/logic/reporter-master-management'),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-non-submission-detection')>('../../src/logic/daily-report-non-submission-detection'),
}));
jest.mock('../../src/logic/non-submission-prompt-decision', () => ({
  ...jest.requireActual<typeof import('../../src/logic/non-submission-prompt-decision')>('../../src/logic/non-submission-prompt-decision'),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-reminder-notification')>('../../src/logic/daily-report-reminder-notification'),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
}));
jest.mock('../../src/logic/daily-report-management-view', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-management-view')>('../../src/logic/daily-report-management-view'),
}));

import { runTx4Imp1Agent, type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterModule from '../../src/logic/reporter-master-management';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';
import * as detectionModule from '../../src/logic/daily-report-non-submission-detection';
import * as leaderNotificationModule from '../../src/logic/daily-report-reminder-notification';
import * as emailNotificationModule from '../../src/logic/email-notification-management';
import * as dashboardModule from '../../src/logic/daily-report-management-view';

describe('SCEN-038: 営業日の対象日に有効な報告者が存在し、全員が日報を提出している場合、提出件数と進捗サマリーが正常に生成されリーダーに通知される', () => {
  const mockAiClient: Tx4Imp1AiClient = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate successful output with 5 submitted reports and progress summary', async () => {
    const targetDate = '2024-01-15';
    const leaderUserId = 'leader-001';
    const teamId = 'team-A';

    jest.spyOn(businessDayModule, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isBusinessDay: true,
      isAcceptable: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    jest.spyOn(reporterModule, 'getActiveReportersForSubmissionCheck').mockResolvedValue({
      success: true,
      reporters: [
        { userId: 'user-001', userName: 'User 1', reporterName: 'Reporter 1', reporterId: 'r-001', emailAddress: 'r1@example.com', department: 'Sales', status: 'active' },
        { userId: 'user-002', userName: 'User 2', reporterName: 'Reporter 2', reporterId: 'r-002', emailAddress: 'r2@example.com', department: 'Sales', status: 'active' },
        { userId: 'user-003', userName: 'User 3', reporterName: 'Reporter 3', reporterId: 'r-003', emailAddress: 'r3@example.com', department: 'Dev', status: 'active' },
        { userId: 'user-004', userName: 'User 4', reporterName: 'Reporter 4', reporterId: 'r-004', emailAddress: 'r4@example.com', department: 'Dev', status: 'active' },
        { userId: 'user-005', userName: 'User 5', reporterName: 'Reporter 5', reporterId: 'r-005', emailAddress: 'r5@example.com', department: 'Admin', status: 'active' },
      ],
      totalCount: 5,
      message: 'Found 5 active reporters',
    });

    jest.spyOn(reportPersistenceModule, 'retrieveDailyReportsForLeaderReview').mockResolvedValue({
      dailyReports: [
        { dailyReportId: 'dr-001', userId: 'user-001', reportDate: '2024-01-15', businessContent: 'Content 1', submittedAt: '2024-01-15T16:00:00Z' },
        { dailyReportId: 'dr-002', userId: 'user-002', reportDate: '2024-01-15', businessContent: 'Content 2', submittedAt: '2024-01-15T16:10:00Z' },
        { dailyReportId: 'dr-003', userId: 'user-003', reportDate: '2024-01-15', businessContent: 'Content 3', submittedAt: '2024-01-15T16:20:00Z' },
        { dailyReportId: 'dr-004', userId: 'user-004', reportDate: '2024-01-15', businessContent: 'Content 4', submittedAt: '2024-01-15T16:30:00Z' },
        { dailyReportId: 'dr-005', userId: 'user-005', reportDate: '2024-01-15', businessContent: 'Content 5', submittedAt: '2024-01-15T16:40:00Z' },
      ],
      totalCount: 5,
      pageNumber: 1,
      pageSize: 100,
      retrievedAt: '2024-01-15T17:00:00Z',
    });

    jest.spyOn(detectionModule, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      nonSubmittedReporters: [],
      detectionLog: {
        detectionLogId: 'log-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T17:00:00Z',
        totalReportersCount: 5,
        nonSubmittedCount: 0,
        submittedCount: 5,
      },
      detectionTimestamp: '2024-01-15T17:00:00Z',
    });

    jest.spyOn(leaderNotificationModule, 'sendLeaderNonSubmissionPromptNotification').mockResolvedValue({
      success: true,
      notificationId: 'notif-001',
      sentAt: new Date('2024-01-15T17:00:00Z'),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 0,
      errorDetails: null,
    });

    jest.spyOn(emailNotificationModule, 'sendNonSubmissionPromptNotification').mockResolvedValue({
      success: true,
      totalTargets: 0,
      successCount: 0,
      failureCount: 0,
      emailSendingHistoryIds: [],
      sentAt: '2024-01-15T17:00:00Z',
    });

    jest.spyOn(dashboardModule, 'retrieveLeaderDashboardData').mockResolvedValue({
      submittedReports: [
        { reportId: 'dr-001', reporterId: 'user-001', reporterName: 'Reporter 1', submissionTime: '2024-01-15T16:00:00Z', businessContent: 'Content 1', achievements: '', issues: '', tomorrowPlan: '', displayDate: '2024-01-15', displayReporterName: 'Reporter 1', displaySubmissionTime: '16:00', displayContent: 'Content 1', isLate: false },
        { reportId: 'dr-002', reporterId: 'user-002', reporterName: 'Reporter 2', submissionTime: '2024-01-15T16:10:00Z', businessContent: 'Content 2', achievements: '', issues: '', tomorrowPlan: '', displayDate: '2024-01-15', displayReporterName: 'Reporter 2', displaySubmissionTime: '16:10', displayContent: 'Content 2', isLate: false },
        { reportId: 'dr-003', reporterId: 'user-003', reporterName: 'Reporter 3', submissionTime: '2024-01-15T16:20:00Z', businessContent: 'Content 3', achievements: '', issues: '', tomorrowPlan: '', displayDate: '2024-01-15', displayReporterName: 'Reporter 3', displaySubmissionTime: '16:20', displayContent: 'Content 3', isLate: false },
        { reportId: 'dr-004', reporterId: 'user-004', reporterName: 'Reporter 4', submissionTime: '2024-01-15T16:30:00Z', businessContent: 'Content 4', achievements: '', issues: '', tomorrowPlan: '', displayDate: '2024-01-15', displayReporterName: 'Reporter 4', displaySubmissionTime: '16:30', displayContent: 'Content 4', isLate: false },
        { reportId: 'dr-005', reporterId: 'user-005', reporterName: 'Reporter 5', submissionTime: '2024-01-15T16:40:00Z', businessContent: 'Content 5', achievements: '', issues: '', tomorrowPlan: '', displayDate: '2024-01-15', displayReporterName: 'Reporter 5', displaySubmissionTime: '16:40', displayContent: 'Content 5', isLate: false },
      ],
      nonSubmittedReporters: [],
      detectionLogs: [],
      emailSendingHistory: [],
      submissionStatusSummary: {
        totalReporters: 5,
        submittedCount: 5,
        nonSubmittedCount: 0,
        reminderSentCount: 0,
        submissionRate: 100,
      },
      progressSummary: '提出率100%、全員提出、未提出者なし',
    });

    const input = { targetDate, leaderUserId, teamId };
    const output = await runTx4Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toBe('success');
    expect(output.targetDate).toBe('2024-01-15');
    expect(output.submittedReportCount).toBe(5);
    expect(output.nonSubmittedReporterCount).toBe(0);
    expect(output.nonSubmittedReporters).toEqual([]);
    expect(output.promptNotificationsSent).toBe(0);
    expect(output.promptNotificationsFailed).toBe(0);
    expect(output.progressSummary).toBe('提出率100%、全員提出、未提出者なし');
    expect(output.leaderNotificationSent).toBe(true);
    expect(output.detectionLogId).toBe('log-001');
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(output.errors).toBeUndefined();
  });
});
