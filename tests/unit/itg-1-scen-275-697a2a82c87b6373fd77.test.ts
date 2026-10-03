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

describe('SCEN-275: 期限前の場合、催促が不要と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return not necessary for 30 minutes before deadline', async () => {
    const mockIsWithinSubmissionDeadline = businessDayDeadline.isWithinSubmissionDeadline as jest.Mock;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: 30
    });

    const input = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null
    };

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.overdueDurationMinutes).toBe(-30);
  });
});
