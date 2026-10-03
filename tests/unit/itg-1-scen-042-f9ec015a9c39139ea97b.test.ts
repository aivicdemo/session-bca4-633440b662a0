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

describe('SCEN-042: 未提出者検知処理が失敗した場合、NonSubmissionDetectionFailedエラーが発生しexecutionStatusはfailureになる', () => {
  const mockAiClient: Tx4Imp1AiClient = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failure status when detectNonSubmittedReportersAtDeadline fails', async () => {
    const targetDate = '2024-01-15';
    const leaderUserId = 'leader-001';
    const teamId = 'team-001';

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
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 100,
      retrievedAt: '2024-01-15T17:00:00Z',
    });

    jest.spyOn(detectionModule, 'detectNonSubmittedReportersAtDeadline').mockRejectedValue(
      new Error('未提出者検知に失敗しました')
    );

    const input = { targetDate, leaderUserId, teamId };
    const output = await runTx4Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toBe('failure');
    expect(output.errors).toBeDefined();
    expect(output.errors?.length).toBeGreaterThan(0);
    expect(output.errors?.[0]?.code).toBe('NonSubmissionDetectionFailed');
    expect(output.errors?.[0]?.message).toContain('未提出者の検知に失敗しました');
    expect(output.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
