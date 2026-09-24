import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  NoActiveReportersError,
} from '../../src/logic/daily-report-non-submission-detection';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMaster from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-238: チームに報告者が登録されていない場合は検知対象がない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoActiveReportersError when no active reporters exist', () => {
    const mockJudgeScheduler = jest.spyOn(deadlineJudgment, 'judgeSchedulerExecutionTiming' as any);
    mockJudgeScheduler.mockReturnValue(true);

    const mockGetReporters = jest.spyOn(reporterMaster, 'getActiveReportersForSubmissionCheck' as any);
    mockGetReporters.mockReturnValue([]);

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow(NoActiveReportersError);
    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow(
      /検知対象の有効な報告者が存在しません/
    );
  });
});
