import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-185: 営業日外の場合 rejectionReason に「営業日外」が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日外の場合、rejectionReason が「営業日外」と「reject」', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-06',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-06T10:00:00Z',
    };

    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.submissionDeadlineForTargetDate).toBeNull();
    expect(result.processingPolicy).toBe('reject');
    expect(result.rejectionReason).toBe('営業日外');
  });
});
