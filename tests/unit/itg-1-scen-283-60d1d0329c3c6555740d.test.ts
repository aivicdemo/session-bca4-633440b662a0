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

describe('SCEN-283: 兆候が判断できない場合、推測理由に「unknown」が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('兆候が判断できない場合、estimatedNonSubmissionReasonが「unknown」である', async () => {
    const input = {
      userId: 'user001',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    (businessDayModule.isWithinSubmissionDeadline as jest.Mock).mockReturnValue(Promise.resolve({
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2025-01-15T17:00:00Z',
      minutesUntilDeadline: 30,
    }));

    (persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.Mock).mockReturnValue(Promise.resolve({
      detectionLogs: [],
    }));

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.overdueDurationMinutes).toBe(-30);
  });
});
