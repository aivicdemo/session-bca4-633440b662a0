import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-180: 営業日外で isAcceptable が true、processingPolicy が defer_to_next_business_day になる', () => {
  it('営業日外（休業日）の提出は defer_to_next_business_day で受け付ける', () => {
    const input = {
      targetDate: '2024-01-01',
      teamLeaderId: 'TL001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-01T15:30:00Z',
    };

    const result = judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(true);
    expect(result.processingPolicy).toBe('defer_to_next_business_day');
    expect(result.isBusinessDay).toBe(false);
    expect(result.rejectionReason).toBeNull();
    expect(result.submissionDeadlineForTargetDate).toBeNull();
  });
});
