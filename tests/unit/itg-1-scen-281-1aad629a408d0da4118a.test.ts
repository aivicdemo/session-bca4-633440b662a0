import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-281: 業務多忙の兆候が検出された場合、推測理由に「business_busy」が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set business_busy reason when busy schedule is detected', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-busy-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    (deadlineJudgment.isWithinSubmissionDeadline as jest.Mock).mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: -90,
    });

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('email_and_system_notification');
    expect(result.estimatedNonSubmissionReason).toBe('business_busy');
    expect(result.suggestedPromptMessage).toContain('業務');
    expect(result.overdueDurationMinutes).toBe(90);
  });
});
