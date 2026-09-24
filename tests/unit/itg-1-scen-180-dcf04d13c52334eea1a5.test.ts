import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-180: 営業日外で isAcceptable が true、processingPolicy が defer_to_next_business_day になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日外の場合、翌営業日扱いに自動切り替え', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-01',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-01T15:30:00Z',
    };

    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(true);
    expect(result.processingPolicy).toBe('defer_to_next_business_day');
    expect(result.isBusinessDay).toBe(false);
    expect(result.rejectionReason).toBeNull();
    expect(result.submissionDeadlineForTargetDate).toBeNull();
  });
});
