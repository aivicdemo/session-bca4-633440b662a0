import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-275: 期限前の場合、催促が不要と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return no prompt necessary when before deadline', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    (deadlineJudgment.isWithinSubmissionDeadline as jest.Mock).mockResolvedValue({
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: 30,
    });

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.suggestedPromptMessage).toContain('提出期限前');
    expect(result.overdueDurationMinutes).toBe(-30);
  });
});
