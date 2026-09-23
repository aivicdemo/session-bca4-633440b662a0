import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-184: 期限超過の場合 rejectionReason に「期限超過」が設定される', () => {
  it('営業日で期限超過の場合、rejectionReason が「期限超過」となる', () => {
    const input = {
      targetDate: '2024-01-15',
      teamLeaderId: 'TL001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-15T18:00:00Z',
    };

    const result = judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.submissionDeadlineForTargetDate).toBe('2024-01-15T17:00:00Z');
    expect(result.processingPolicy).toBe('reject');
    expect(result.rejectionReason).toBe('期限超過');
  });
});
