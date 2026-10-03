import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import * as businessDayDeadline from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  isWithinSubmissionDeadline: jest.fn()
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockResolvedValue({
    detectionLogs: [
      { userId: 'user-001', targetDate: '2024-01-15' },
      { userId: 'user-001', targetDate: '2024-01-14' }
    ]
  })
}));

describe('SCEN-277: 連続未提出日数が2日以上の場合、中以上の優先度で催促が必要', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return medium priority for 2 consecutive non-submission days', async () => {
    const mockIsWithinSubmissionDeadline = businessDayDeadline.isWithinSubmissionDeadline as jest.Mock;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: -35
    });

    const input = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:35:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null
    };

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('medium');
    expect(result.promptMethod).toBe('email_and_system_notification');
    expect(result.estimatedNonSubmissionReason).toBe('business_busy');
    expect(result.suggestedPromptMessage).not.toBe('');
    expect(result.overdueDurationMinutes).toBe(35);
  });
});
