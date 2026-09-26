import { judgePromptNecessityAndMethod, JudgePromptNecessityAndMethodInput, JudgePromptNecessityAndMethodOutput } from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-272: 期限超過1時間以上の場合、高優先度で催促が必要と判定される', () => {
  it('should return high priority and escalate_to_leader method when overdue >= 60 minutes', async () => {
    // Arrange
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:15:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // Act
    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    // Assert
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.suggestedPromptMessage).not.toBe('');
    expect(result.overdueDurationMinutes).toBe(75);
  });
});
