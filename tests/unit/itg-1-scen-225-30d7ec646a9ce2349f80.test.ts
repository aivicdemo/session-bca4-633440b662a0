import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  DeadlineNotReachedError,
} from '../../src/logic/daily-report-non-submission-detection';
import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-225: 提出期限に達していない時刻での実行を拒否する', () => {
  const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.MockedFunction<typeof judgeSchedulerExecutionTiming>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('提出期限時刻より1分前（16:59）に実行された場合、DeadlineNotReachedError をスローする', async () => {
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T16:59:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    mockJudgeSchedulerExecutionTiming.mockResolvedValue(false);

    let thrownError: unknown;
    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(DeadlineNotReachedError);
    expect((thrownError as Error).message).toBe('日報提出期限に達していないため、未提出者検知を実行できません。');
  });
});
