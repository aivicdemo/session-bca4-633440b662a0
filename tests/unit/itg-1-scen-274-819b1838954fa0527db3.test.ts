import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-274: 期限超過30分未満の場合、低優先度で催促が必要と判定され、メール送信のみを提案する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return low priority with email only when overdue less than 30 minutes', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T17:20:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    (deadlineJudgment.isWithinSubmissionDeadline as jest.Mock).mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2025-01-15T17:00:00Z',
      minutesUntilDeadline: -20,
    });

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(['unknown', 'input_forgotten']).toContain(result.estimatedNonSubmissionReason);
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.overdueDurationMinutes).toBe(20);
  });
});
