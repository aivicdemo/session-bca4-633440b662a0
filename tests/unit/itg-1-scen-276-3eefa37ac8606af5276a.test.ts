import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-276: 期限超過1時間未満で過去の提出率が高い場合、低優先度に調整される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return low priority when overdue but with high submission history', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    (deadlineJudgment.isWithinSubmissionDeadline as jest.Mock).mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: -45,
    });

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.estimatedNonSubmissionReason).toBe('input_forgotten');
    expect(result.suggestedPromptMessage).toContain('過去の提出習慣');
    expect(result.overdueDurationMinutes).toBe(45);
  });
});
