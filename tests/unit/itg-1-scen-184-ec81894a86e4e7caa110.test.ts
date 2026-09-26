import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-184: 期限超過の場合 rejectionReason に「期限超過」が設定される', () => {
  it('期限超過時に rejectionReason=期限超過 を返す', async () => {
    const input = {
      targetDate: '2024-01-15',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-15T18:00:00Z'
    };

    const result = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.submissionDeadlineForTargetDate).toBe('2024-01-15T17:00:00Z');
    expect(result.processingPolicy).toBe('reject');
    expect(result.rejectionReason).toBe('期限超過');
  });
});
