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

import { detectNonSubmittedReportersAtDeadline, NoActiveReportersError } from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterModule from '../../src/logic/reporter-master-management';
import type { JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';
import type { GetActiveReportersForSubmissionCheckOutput } from '../../src/logic/reporter-master-management';

describe('SCEN-246: 報告者マスタが空の場合は警告を返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should throw NoActiveReportersError when reporter master is empty', async () => {
    const timerOutput: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '実行タイミング内',
    };
    jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockResolvedValue(timerOutput);

    const reporterOutput: GetActiveReportersForSubmissionCheckOutput = {
      success: true,
      reporters: [],
      totalCount: 0,
      message: 'No active reporters found',
    };
    jest.spyOn(reporterMasterModule, 'getActiveReportersForSubmissionCheck').mockResolvedValue(reporterOutput);

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:05:00Z',
        submissionDeadlineTime: '17:00',
        teamId: 'team-001',
      })
    ).rejects.toThrow(NoActiveReportersError);

    await expect(
      detectNonSubmittedReportersAtDeadline({
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:05:00Z',
        submissionDeadlineTime: '17:00',
        teamId: 'team-001',
      })
    ).rejects.toThrow('検知対象の有効な報告者が存在しません。');
  });
});
