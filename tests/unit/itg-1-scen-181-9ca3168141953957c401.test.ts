import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-181: 期限超過で isAcceptable が false、processingPolicy が reject になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期限超過の場合、受付不可と判定される', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'TL001',
      reporterUserId: 'R001',
      submissionAttemptTimestamp: '2024-01-15T18:00:00Z',
    };

    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.processingPolicy).toBe('reject');
    expect(result.rejectionReason).toBe('期限超過');
  });
});
