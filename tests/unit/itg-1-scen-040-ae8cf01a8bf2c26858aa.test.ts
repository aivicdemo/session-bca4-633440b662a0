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

describe('SCEN-040: 対象日時点で有効な報告者が存在しない場合、NoActiveReportersFoundエラーが発生する', () => {
  const mockAiClient: Tx4Imp1AiClient = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failure status with NoActiveReportersFound error', async () => {
    const targetDate = '2024-01-15';
    const leaderUserId = 'leader-001';
    const teamId = undefined;

    jest.spyOn(businessDayModule, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isBusinessDay: true,
      isAcceptable: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    jest.spyOn(reporterModule, 'getActiveReportersForSubmissionCheck').mockRejectedValue(
      new Error('提出状況を確認する対象の報告者が存在しません。')
    );

    const input = { targetDate, leaderUserId, teamId };
    const output = await runTx4Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toBe('failure');
    expect(output.errors).toBeDefined();
    expect(output.errors?.length).toBeGreaterThan(0);
    expect(output.errors?.[0]?.message).toContain('提出状況を確認する対象の報告者が存在しません');
    expect(detectionModule.detectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(reportPersistenceModule.retrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
  });
});
