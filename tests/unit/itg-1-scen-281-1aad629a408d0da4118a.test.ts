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

describe('SCEN-281: 業務多忙の兆候が検出された場合、推測理由に「business_busy」が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('業務多忙の兆候が検出された場合、estimatedNonSubmissionReasonが「business_busy」である', async () => {
    const input = {
      userId: 'user-busy-001',
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
        { userId: 'user-busy-001', targetDate: '2024-01-15' },
        { userId: 'user-busy-001', targetDate: '2024-01-14' },
      ],
    }));

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.estimatedNonSubmissionReason).toBe('business_busy');
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('email_and_system_notification');
    expect(result.overdueDurationMinutes).toBe(90);
    expect(result.suggestedPromptMessage).toContain('業務多忙');
  });
});
