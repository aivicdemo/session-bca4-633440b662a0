import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-170: 営業日かつ期限内の提出で日報が受け付けられる', () => {
  it('営業日かつ期限内の提出で日報が受け付けられる', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'TL-001',
      reporterUserId: 'RPT-001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
    };

    const result = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinDeadline).toBe(true);
    expect(result.submissionDeadlineForTargetDate).toBe('2024-01-15T17:00:00Z');
    expect(result.processingPolicy).toBe('accept');
    expect(result.rejectionReason).toBeNull();
  });
});
