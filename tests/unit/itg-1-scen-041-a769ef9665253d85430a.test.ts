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

describe('SCEN-041: 日報の自動解析に失敗した場合、DailyReportAnalysisFailedエラーが発生しexecutionStatusはfailureになる', () => {
  const mockAiClient: Tx4Imp1AiClient = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failure status when retrieveDailyReportsForLeaderReview fails', async () => {
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
      ],
      totalCount: 1,
      message: 'Found 1 active reporter',
    });

    jest.spyOn(reportPersistenceModule, 'retrieveDailyReportsForLeaderReview').mockRejectedValue(
      new Error('日報の自動解析処理に失敗しました。')
    );

    const input = { targetDate, leaderUserId, teamId };
    const output = await runTx4Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toBe('failure');
    expect(output.errors).toBeDefined();
    expect(output.errors?.length).toBeGreaterThan(0);
    expect(output.errors?.[0]?.code).toBe('DailyReportAnalysisFailed');
    expect(output.errors?.[0]?.message).toContain('日報の自動解析処理に失敗しました');
    expect(output.submittedReportCount).toBeUndefined();
    expect(output.nonSubmittedReporterCount).toBeUndefined();
    expect(output.progressSummary).toBeUndefined();
    expect(output.detectionLogId).toBeUndefined();
  });
});
