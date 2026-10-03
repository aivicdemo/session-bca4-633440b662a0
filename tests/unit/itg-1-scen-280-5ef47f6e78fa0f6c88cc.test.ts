import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  isWithinSubmissionDeadline: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));

import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as persistenceModule from '../../src/logic/daily-report-persistence';

describe('SCEN-280: システム障害の兆候が検出された場合、推測理由に「system_issue」が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('システム障害が検出された場合、estimatedNonSubmissionReasonが「system_issue」である', async () => {
    const input = {
      userId: 'user001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    (businessDayModule.isWithinSubmissionDeadline as jest.Mock).mockReturnValue(Promise.resolve({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: -90,
    }));

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockReturnValue(Promise.resolve({
      detectionLogs: [
        { userId: 'user001', targetDate: '2024-01-15' },
        { userId: 'user001', targetDate: '2024-01-14' },
        { userId: 'user001', targetDate: '2024-01-13' },
      ],
    }));

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.estimatedNonSubmissionReason).toBe('system_issue');
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.suggestedPromptMessage).toContain('システム障害');
    expect(result.overdueDurationMinutes).toBe(90);
  });
});
