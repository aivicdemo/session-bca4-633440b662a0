import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-185: 営業日外の場合 rejectionReason に「営業日外」が設定される', () => {
  it('営業日外時に rejectionReason=営業日外 を返す', async () => {
    const input = {
      targetDate: '2024-01-06',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-06T14:00:00Z'
    };

    const result = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.submissionDeadlineForTargetDate).toBeNull();
    expect(result.processingPolicy).toBe('defer_to_next_business_day');
    expect(result.rejectionReason).toBe('営業日外です');
  });
});
