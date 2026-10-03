import { judgePromptNecessityAndMethod, JudgePromptNecessityAndMethodOutput } from '../../src/logic/non-submission-prompt-decision';
import * as businessDayDeadline from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  isWithinSubmissionDeadline: jest.fn()
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockResolvedValue({ detectionLogs: [] })
}));

describe('SCEN-272: 期限超過1時間以上の場合、高優先度で催促が必要と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return high priority escalation for 75 minutes overdue', async () => {
    const mockIsWithinSubmissionDeadline = businessDayDeadline.isWithinSubmissionDeadline as jest.Mock;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: -75
    });

    const input = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:15:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null
    };

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.suggestedPromptMessage).not.toBe('');
    expect(result.overdueDurationMinutes).toBe(75);
  });
});
