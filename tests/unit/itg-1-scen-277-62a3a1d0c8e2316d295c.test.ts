import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-277: 連続未提出日数が2日以上の場合、中以上の優先度で催促が必要と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return medium priority when consecutive missed days are 2 or more', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:35:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    (deadlineJudgment.isWithinSubmissionDeadline as jest.Mock).mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: -35,
    });

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('medium');
    expect(['email_and_system_notification', 'escalate_to_leader']).toContain(result.promptMethod);
    expect(result.suggestedPromptMessage).toContain('連続未提出');
    expect(result.overdueDurationMinutes).toBe(35);
  });
});
