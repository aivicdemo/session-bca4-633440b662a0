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

  it('should throw NoActiveReportersError when no active reporters exist', async () => {
    const mockJudgeScheduler = jest.spyOn(deadlineJudgment, 'judgeSchedulerExecutionTiming' as any);
    mockJudgeScheduler.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: 'Deadline reached',
    });

    const mockGetReporters = jest.spyOn(reporterMaster, 'getActiveReportersForSubmissionCheck' as any);
    mockGetReporters.mockResolvedValue({
      success: true,
      reporters: [],
      totalCount: 0,
      message: 'No active reporters',
    });

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(NoActiveReportersError);
    await expect(detectNonSubmittedReportersAtDeadline(input)).rejects.toThrow(
      /検知対象の有効な報告者が存在しません/
    );
  });
});
