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

describe('SCEN-282: 入力忘れの兆候が検出された場合、推測理由に「input_forgotten」が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('入力忘れの兆候が検出された場合、estimatedNonSubmissionReasonが「input_forgotten」である', async () => {
    const input = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    (businessDayModule.isWithinSubmissionDeadline as jest.Mock).mockReturnValue(Promise.resolve({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: -105,
    }));

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockReturnValue(Promise.resolve({
      detectionLogs: [
        { userId: 'user-001', targetDate: '2024-01-15' },
      ],
    }));

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.estimatedNonSubmissionReason).toBe('input_forgotten');
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.overdueDurationMinutes).toBe(105);
  });
});
