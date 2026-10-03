import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-174: 営業日外の提出が翌営業日扱いに自動切り替えられる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('休業日（2024-01-06）に提出した場合、isAcceptableがfalse、isBusinessDayがfalse、processingPolicyが"defer_to_next_business_day"で翌営業日に切り替えられる', async () => {
    const input = {
      targetDate: '2024-01-06',
      teamLeaderId: 'leader001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-06T10:00:00Z'
    };

    const result = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.processingPolicy).toBe('defer_to_next_business_day');
    expect(result.rejectionReason).toBe('営業日外です');
    expect(result.submissionDeadlineForTargetDate).toBeNull();
  });
});
