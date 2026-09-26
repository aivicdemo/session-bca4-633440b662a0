import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-282: 入力忘れの兆候が検出された場合、推測理由に「input_forgotten」が設定される', () => {
  it('should set input_forgotten reason when input omission is detected', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.estimatedNonSubmissionReason).toBe('input_forgotten');
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.overdueDurationMinutes).toBe(105);
  });
});
