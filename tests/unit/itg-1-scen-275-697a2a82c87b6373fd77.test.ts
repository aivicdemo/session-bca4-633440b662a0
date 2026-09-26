import { judgePromptNecessityAndMethod, JudgePromptNecessityAndMethodInput, JudgePromptNecessityAndMethodOutput } from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-275: 期限前の場合、催促が不要と判定される', () => {
  it('should return isPromptNecessary false when before deadline', async () => {
    // Arrange
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // Act
    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    // Assert
    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.overdueDurationMinutes).toBe(-30);
  });
});
