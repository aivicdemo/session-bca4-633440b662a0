import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-170: 営業日かつ期限内の提出で日報が受け付けられる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日カレンダーに2024-01-15（月）を営業日として設定し、チームリーダーTL-001の提出期限が17:00の場合、期限内の提出で日報が受け付けられる', async () => {
    const input = {
      targetDate: '2024-01-15',
      teamLeaderId: 'TL-001',
      reporterUserId: 'RPT-001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z'
    };

    const result = await judgeBusinessDayAndDeadline(input);

    expect(result).toEqual({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      processingPolicy: 'accept',
      rejectionReason: null
    });
  });
});
