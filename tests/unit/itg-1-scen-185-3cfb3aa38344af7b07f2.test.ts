import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-185: 営業日外の場合 rejectionReason に「営業日外」が設定される', () => {
  it('営業日外に判定すると rejectionReason に「営業日外です」が設定される', async () => {
    const result = await judgeBusinessDayAndDeadline({
      targetDate: '2024-01-06',
      teamLeaderId: 'tl001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-06T14:00:00Z'
    });

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.submissionDeadlineForTargetDate).toBeNull();
    expect(result.processingPolicy).toBe('defer_to_next_business_day');
    expect(result.rejectionReason).toBe('営業日外です');
  });
});
