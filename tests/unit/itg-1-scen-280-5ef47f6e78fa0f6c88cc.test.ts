import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');

import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

const mockedIsWithinSubmissionDeadline = businessDayModule.isWithinSubmissionDeadline as jest.MockedFunction<any>;

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

    mockedIsWithinSubmissionDeadline.mockReturnValue(false);

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.estimatedNonSubmissionReason).toBe('system_issue');
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.suggestedPromptMessage).toContain('システム障害');
    expect(result.overdueDurationMinutes).toBe(90);
  });
});
