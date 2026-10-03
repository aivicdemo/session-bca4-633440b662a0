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

import { detectNonSubmittedReportersAtDeadline, DeadlineNotReachedError } from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-243: 提出期限に達していない場合の検知をスキップする', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should throw DeadlineNotReachedError when deadline is not reached', async () => {
    const output: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: false,
      isBusinessDay: true,
      isWithinExecutionWindow: false,
      nextScheduledExecutionTime: '2024-01-15T17:00:00Z',
      executionReason: '期限未到達',
    };
    jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockResolvedValue(output);

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T16:30:00Z',
        submissionDeadlineTime: '17:00',
        teamId: 'team-001',
      })
    ).rejects.toThrow(DeadlineNotReachedError);

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T16:30:00Z',
        submissionDeadlineTime: '17:00',
        teamId: 'team-001',
      })
    ).rejects.toThrow('日報提出期限に達していないため、未提出者検知を実行できません。');
  });
});
