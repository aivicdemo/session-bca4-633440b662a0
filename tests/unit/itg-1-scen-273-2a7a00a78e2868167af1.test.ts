import { describe, it, expect, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-273: 期限超過30分以上1時間未満の場合、中優先度で催促が必要と判定される', () => {
  it('should return medium priority with email_and_system_notification when overdue 45 minutes', async () => {
    // Setup stub for isWithinSubmissionDeadline
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<
      typeof isWithinSubmissionDeadline
    >;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      overdueDurationMinutes: 45,
    });

    // Prepare test input
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // Call the function
    const result: JudgePromptNecessityAndMethodOutput =
      await judgePromptNecessityAndMethod(input);

    // Verify the output
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('medium');
    expect(result.promptMethod).toBe('email_and_system_notification');
    expect(result.overdueDurationMinutes).toBe(45);
    expect(['business_busy', 'system_issue', 'input_forgotten', 'unknown']).toContain(
      result.estimatedNonSubmissionReason
    );
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.suggestedPromptMessage.length).toBeGreaterThan(0);
  });
});
