import { describe, it, expect, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-280: システム障害の兆候が検出された場合、推測理由に「system_issue」が設定される', () => {
  it('should detect system_issue when system failure indicators are present', async () => {
    // Setup stub for isWithinSubmissionDeadline
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<
      typeof isWithinSubmissionDeadline
    >;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      overdueDurationMinutes: 90,
    });

    // Prepare test input
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user001',
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
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.estimatedNonSubmissionReason).toBe('system_issue');
    expect(result.suggestedPromptMessage).toContain('システム障害');
    expect(result.overdueDurationMinutes).toBe(90);
  });
});
