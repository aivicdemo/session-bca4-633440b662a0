import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-175: 期限超過の提出が翌営業日扱いに自動切り替えられる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日の期限超過提出（2025-01-17T18:30:00Z）の場合、isAcceptableがfalse、isBusinessDayがtrue、isWithinDeadlineがfalse、processingPolicyが"defer_to_next_business_day"で翌営業日に切り替えられる', async () => {
    const input = {
      targetDate: '2025-01-17',
      teamLeaderId: 'TL001',
      reporterUserId: 'RPT001',
      submissionAttemptTimestamp: '2025-01-17T18:30:00Z'
    };

    const result = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.submissionDeadlineForTargetDate).toBe('2025-01-17T17:00:00Z');
    expect(result.processingPolicy).toBe('defer_to_next_business_day');
    expect(result.rejectionReason).toBe('期限超過');
  });
});
