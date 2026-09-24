import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-272: 期限超過1時間以上の場合、高優先度で催促が必要と判定され、エスカレーション方法を提案する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return high priority escalation when overdue more than 1 hour', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:15:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    (deadlineJudgment.isWithinSubmissionDeadline as jest.Mock).mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: -75,
    });

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.suggestedPromptMessage).toContain('75分');
    expect(result.overdueDurationMinutes).toBe(75);
  });
});
