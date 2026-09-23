import { describe, it, expect, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-281: 業務多忙の兆候が検出された場合、推測理由に「business_busy」が設定される', () => {
  it('should detect business_busy when business load indicators are present', async () => {
    // Setup stub for isWithinSubmissionDeadline
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<
      typeof isWithinSubmissionDeadline
    >;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      overdueDurationMinutes: 90,
    });

    // Prepare test input
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-busy-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // Call the function
    const result: JudgePromptNecessityAndMethodOutput =
      await judgePromptNecessityAndMethod(input);

    // Verify the output
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('email_and_system_notification');
    expect(result.estimatedNonSubmissionReason).toBe('business_busy');
    expect(result.suggestedPromptMessage).toContain('業務多忙');
    expect(result.overdueDurationMinutes).toBe(90);
  });
});
