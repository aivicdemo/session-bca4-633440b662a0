import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-283: 兆候が判断できない場合、推測理由に「unknown」が設定される', () => {
  it('should set unknown reason when detection is before deadline and cannot determine', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user001',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.overdueDurationMinutes).toBeLessThan(0);
  });
});
