import { judgePromptNecessityAndMethod, JudgePromptNecessityAndMethodInput, JudgePromptNecessityAndMethodOutput } from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-273: 期限超過30分以上1時間未満の場合、中優先度で催促が必要と判定される', () => {
  it('should return medium priority and email_and_system_notification method when 30 <= overdue < 60 minutes', async () => {
    // Arrange
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // Act
    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    // Assert
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('medium');
    expect(result.promptMethod).toBe('email_and_system_notification');
    expect(result.overdueDurationMinutes).toBe(45);
    expect(['business_busy', 'system_issue', 'input_forgotten', 'unknown']).toContain(result.estimatedNonSubmissionReason);
    expect(result.suggestedPromptMessage).not.toBe('');
  });
});
