import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-278: 連続未提出日数が3日以上の場合、高優先度でエスカレーション方法を提案する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return high priority escalation when consecutive missed days are 3 or more', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T20:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 2,
      previousReminderSentDateTime: '2025-01-15T18:00:00Z',
    };

    (deadlineJudgment.isWithinSubmissionDeadline as jest.Mock).mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2025-01-15T17:00:00Z',
      minutesUntilDeadline: -210,
    });

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(['business_busy', 'system_issue', 'input_forgotten', 'unknown']).toContain(
      result.estimatedNonSubmissionReason
    );
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.overdueDurationMinutes).toBe(210);
  });
});
