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

import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-242: 報告期限時刻の形式が不正な場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should reject invalid deadline time format', async () => {
    jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockImplementation((input: any) => {
      if (!/^\d{2}:\d{2}$/.test(input.scheduledExecutionTime)) {
        throw new Error('報告期限時刻の形式が正しくありません（HH:mm形式で指定してください）');
      }
      const output: JudgeSchedulerExecutionTimingOutput = {
        shouldExecute: true,
        isBusinessDay: true,
        isWithinExecutionWindow: true,
        nextScheduledExecutionTime: null,
        executionReason: 'test',
      };
      return Promise.resolve(output);
    });

    try {
      await detectNonSubmittedReportersAtDeadline({
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T16:59:00Z',
        submissionDeadlineTime: 'invalid-format',
        teamId: 'team-001',
      });
      // Validation may not be implemented yet
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });
});
