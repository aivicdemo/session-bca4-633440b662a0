import { describe, it, expect, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-274: 期限超過30分未満の場合、低優先度で催促が必要と判定される', () => {
  it('should return low priority email-only when overdue 20 minutes', async () => {
    // Setup stub for isWithinSubmissionDeadline to return false (overdue)
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<
      typeof isWithinSubmissionDeadline
    >;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      overdueDurationMinutes: 20,
    });

    // Prepare test input
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T17:20:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // Call the function
    const result: JudgePromptNecessityAndMethodOutput =
      await judgePromptNecessityAndMethod(input);

    // Verify the output
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.overdueDurationMinutes).toBe(20);
    expect(['unknown', 'input_forgotten']).toContain(result.estimatedNonSubmissionReason);
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.suggestedPromptMessage.length).toBeGreaterThan(0);
  });
});
