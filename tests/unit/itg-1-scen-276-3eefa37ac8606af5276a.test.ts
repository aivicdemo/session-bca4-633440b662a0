import { judgePromptNecessityAndMethod, JudgePromptNecessityAndMethodInput, JudgePromptNecessityAndMethodOutput } from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-276: 期限超過1時間未満で過去の提出率が高い場合、低優先度に調整される', () => {
  it('should return low priority and email method when overdue < 60 and high submission history', async () => {
    // Arrange
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user001',
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
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.estimatedNonSubmissionReason).toBe('input_forgotten');
    expect(result.overdueDurationMinutes).toBe(45);
    expect(result.suggestedPromptMessage).toContain('過去の提出習慣が良好なため');
  });
});
