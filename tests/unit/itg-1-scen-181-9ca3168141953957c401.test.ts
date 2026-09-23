import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-181: 期限超過で isAcceptable が false、processingPolicy が reject になる', () => {
  it('営業日で期限超過の提出は reject で拒否する', () => {
    const input = {
      targetDate: '2024-01-15',
      teamLeaderId: 'TL001',
      reporterUserId: 'R001',
      submissionAttemptTimestamp: '2024-01-15T18:00:00Z',
    };

    const result = judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.processingPolicy).toBe('reject');
    expect(result.rejectionReason).toBe('期限超過');
  });
});
