import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-183: 営業日で期限内の場合 submissionDeadlineForTargetDate に期限が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日で期限内の場合、期限が設定される', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'tl001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
    };

    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinDeadline).toBe(true);
    expect(result.submissionDeadlineForTargetDate).toBe('2024-01-15T17:00:00Z');
    expect(result.processingPolicy).toBe('accept');
    expect(result.rejectionReason).toBeNull();
  });
});
