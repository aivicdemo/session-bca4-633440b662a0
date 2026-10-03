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
      { userId: 'user-001', targetDate: '2025-01-15' },
      { userId: 'user-001', targetDate: '2025-01-14' },
      { userId: 'user-001', targetDate: '2025-01-13' }
    ]
  })
}));

describe('SCEN-278: 連続未提出日数が3日以上の場合、高優先度でエスカレーション方法を提案', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return high priority with escalation for 3 consecutive non-submission days', async () => {
    const mockIsWithinSubmissionDeadline = businessDayDeadline.isWithinSubmissionDeadline as jest.Mock;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2025-01-15T17:00:00Z',
      minutesUntilDeadline: -210
    });

    const input = {
      userId: 'user-001',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T20:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 2,
      previousReminderSentDateTime: '2025-01-15T18:00:00Z'
    };

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.estimatedNonSubmissionReason).toBe('system_issue');
    expect(result.suggestedPromptMessage).not.toBe('');
    expect(result.suggestedPromptMessage).toContain('3日');
    expect(result.suggestedPromptMessage).toContain('リーダー');
    expect(result.overdueDurationMinutes).toBe(210);
  });
});
