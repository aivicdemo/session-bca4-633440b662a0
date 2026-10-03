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

describe('SCEN-039: 指定対象日が営業日でない場合、TargetDateNotBusinessDayエラーが発生し処理が中断される', () => {
  const mockAiClient: Tx4Imp1AiClient = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failure status with TargetDateNotBusinessDay error', async () => {
    const targetDate = '2025-01-11';
    const leaderUserId = 'leader-001';
    const teamId = 'team-001';

    jest.spyOn(businessDayModule, 'judgeBusinessDayAndDeadline').mockRejectedValue(
      new Error('対象日が営業日ではないため処理を実行できません。')
    );

    const input = { targetDate, leaderUserId, teamId };
    const output = await runTx4Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toBe('failure');
    expect(output.targetDate).toBe('2025-01-11');
    expect(output.errors).toBeDefined();
    expect(output.errors?.length).toBeGreaterThan(0);
    expect(output.errors?.[0]?.message).toContain('営業日');
  });
});
