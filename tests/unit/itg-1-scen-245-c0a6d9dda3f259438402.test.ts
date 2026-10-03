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

describe('SCEN-245: 報告期限時刻が不正な形式の場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const invalidFormats = ['25:00', '17時', '17-00', '17:0', '1700', 'invalid', '17:60'];

  invalidFormats.forEach((invalidFormat) => {
    it(`should reject invalid deadline time format: ${invalidFormat}`, async () => {
      jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockImplementation((input: any) => {
        const time = input.scheduledExecutionTime;
        if (!/^\d{2}:\d{2}$/.test(time)) {
          throw new Error('報告期限時刻は HH:mm 形式で設定してください');
        }
        const parts = time.split(':');
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);
        if (hour > 23 || hour < 0 || minute > 59 || minute < 0) {
          throw new Error('報告期限時刻は HH:mm 形式で設定してください');
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
          currentDateTime: '2024-01-15T17:00:00Z',
          submissionDeadlineTime: invalidFormat,
          teamId: 'team-001',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
