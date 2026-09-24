import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DeadlineNotReachedError,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMaster from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-234: 提出期限時刻の有効性を検証し正常系と異なる形式を識別する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const invalidFormats = ['25:00', 'ab:cd', '17', '17:00:00', ''];

  invalidFormats.forEach((format) => {
    it(`should identify invalid format: ${format}`, () => {
      const mockJudgeScheduler = jest.spyOn(deadlineJudgment, 'judgeSchedulerExecutionTiming' as any);
      mockJudgeScheduler.mockReturnValue(true);

      const mockGetReporters = jest.spyOn(reporterMaster, 'getActiveReportersForSubmissionCheck' as any);
      mockGetReporters.mockReturnValue([
        { userId: 'reporter1', userName: 'Reporter 1', emailAddress: 'reporter1@example.com', departmentId: 'dept-1' },
      ]);

      const input: DetectNonSubmittedReportersAtDeadlineInput = {
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:00:00Z',
        submissionDeadlineTime: format,
        teamId: 'team-001',
      };

      let errorThrown = false;
      let errorName = '';

      try {
        detectNonSubmittedReportersAtDeadline(input);
      } catch (error: any) {
        errorThrown = true;
        errorName = error.constructor.name;
      }

      expect(errorThrown).toBe(true);
      expect([DeadlineNotReachedError, SubmissionStatusCheckFailureError].map(e => e.name)).toContain(errorName);
    });
  });
});
