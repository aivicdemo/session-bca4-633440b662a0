import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-178: 提出日時が過去30日以上前のとき警告が発生する', () => {
  it('提出日時が過去30日以上前の場合に警告が含まれる', async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 31);
    const pastDate = thirtyDaysAgo.toISOString().split('T')[0];

    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: pastDate,
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: `${pastDate}T09:00:00Z`,
    };

    const result = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isWithinDeadline).toBe(false);
    expect(
      [
        result.processingPolicy === 'reject',
        result.processingPolicy === 'defer_to_next_business_day',
      ].some(Boolean)
    ).toBe(true);
    expect(result.rejectionReason).toMatch(/過去30日以上前|期限超過/);
  });
});
