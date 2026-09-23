import { describe, it, expect, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-275: 期限前の場合、催促が不要と判定される', () => {
  it('should not require prompt when before deadline', async () => {
    // Setup stub for isWithinSubmissionDeadline (overdueDurationMinutes = -30)
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<
      typeof isWithinSubmissionDeadline
    >;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      overdueDurationMinutes: -30,
    });

    // Prepare test input
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // Call the function
    const result: JudgePromptNecessityAndMethodOutput =
      await judgePromptNecessityAndMethod(input);

    // Verify the output
    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.suggestedPromptMessage).toContain('提出期限前');
    expect(result.overdueDurationMinutes).toBe(-30);
  });
});
