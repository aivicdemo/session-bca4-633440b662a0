import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-178: 提出日時が過去30日以上前のとき警告が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('提出日時が30日以上前の場合、警告を発生させる', async () => {
    const targetDate = '2023-12-15';
    const submissionAttemptTimestamp = '2023-12-15T09:00:00Z';

    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate,
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp,
    };

    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(false);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.processingPolicy).toMatch(/reject|defer_to_next_business_day/);
    expect(result.rejectionReason).toBeDefined();
    expect(
      result.rejectionReason === '期限超過' ||
        result.rejectionReason?.includes('過去30日以上前') ||
        result.rejectionReason?.includes('警告')
    ).toBe(true);
  });
});
