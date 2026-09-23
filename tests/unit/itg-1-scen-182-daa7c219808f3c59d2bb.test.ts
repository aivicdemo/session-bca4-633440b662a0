import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-182: 営業日外の場合 submissionDeadlineForTargetDate が null になる', () => {
  it('営業日外の提出は期限が null で期限判定不適用となる', () => {
    const input = {
      targetDate: '2024-01-06',
      teamLeaderId: 'TL001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-06T14:00:00Z',
    };

    const result = judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.submissionDeadlineForTargetDate).toBeNull();
    expect(result.processingPolicy).toBe('defer_to_next_business_day');
    expect(result.rejectionReason).toBe('営業日外');
  });
});
