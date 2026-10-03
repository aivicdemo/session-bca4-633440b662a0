import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import * as businessDayDeadline from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  isWithinSubmissionDeadline: jest.fn()
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockResolvedValue({ detectionLogs: [] })
}));

describe('SCEN-273: 期限超過30分以上1時間未満の場合、中優先度で催促が必要', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return medium priority with email_and_system_notification for 45 minutes overdue', async () => {
    const mockIsWithinSubmissionDeadline = businessDayDeadline.isWithinSubmissionDeadline as jest.Mock;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: -45
    });

    const input = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null
    };

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('medium');
    expect(result.promptMethod).toBe('email_and_system_notification');
    expect(result.overdueDurationMinutes).toBe(45);
    expect(['business_busy', 'system_issue', 'input_forgotten', 'unknown']).toContain(result.estimatedNonSubmissionReason);
    expect(result.suggestedPromptMessage).not.toBe('');
  });
});
