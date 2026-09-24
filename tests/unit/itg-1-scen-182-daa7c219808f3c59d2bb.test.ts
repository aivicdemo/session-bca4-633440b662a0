import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-182: 営業日外の場合 submissionDeadlineForTargetDate が null になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日外の場合、submissionDeadlineForTargetDate は null', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-06',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-06T14:00:00Z',
    };

    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.submissionDeadlineForTargetDate).toBeNull();
    expect(result.processingPolicy).toBe('defer_to_next_business_day');
    expect(result.rejectionReason).toBe('営業日外');
  });
});
