import { judgePromptNecessityAndMethod, JudgePromptNecessityAndMethodInput, JudgePromptNecessityAndMethodOutput } from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-274: 期限超過30分未満の場合、低優先度で催促が必要と判定される', () => {
  it('should return low priority and email method when 0 < overdue < 30 minutes', async () => {
    // Arrange
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T17:20:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // Act
    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    // Assert
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.overdueDurationMinutes).toBe(20);
    expect(['unknown', 'input_forgotten']).toContain(result.estimatedNonSubmissionReason);
    expect(result.suggestedPromptMessage).not.toBe('');
  });
});
