import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  NoActiveReportersError,
} from '../../src/logic/daily-report-non-submission-detection';
import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import {
  getActiveReportersForSubmissionCheck,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-226: 検知対象に有効な報告者が存在しない場合は処理を中断する', () => {
  const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<typeof judgeSchedulerExecutionTiming>;
  const mockGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<typeof getActiveReportersForSubmissionCheck>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効な報告者が0名の場合、NoActiveReportersError をスローする', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    mockJudgeSchedulerExecutionTiming.mockResolvedValue(true);
    mockGetActiveReportersForSubmissionCheck.mockResolvedValue([]);

    let thrownError: unknown;
    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(NoActiveReportersError);
    expect((thrownError as Error).message).toBe('検知対象の有効な報告者が存在しません。');
  });
});
