import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');

import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

const mockedIsWithinSubmissionDeadline = businessDayModule.isWithinSubmissionDeadline as jest.MockedFunction<any>;

describe('SCEN-279: リマインダー通知がすでに複数回送信済みの場合、エスカレーション方法を提案する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リマインダー複数回送信済みの場合、promptPriorityが「high」、promptMethodが「escalate_to_leader」である', async () => {
    const input = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 3,
      previousReminderSentDateTime: '2024-01-15T17:15:00Z',
    };

    mockedIsWithinSubmissionDeadline.mockReturnValue(false);

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.suggestedPromptMessage).toContain('3回');
    expect(result.suggestedPromptMessage).toContain('リーダー');
    expect(result.suggestedPromptMessage).toContain('直接対応');
    expect(result.overdueDurationMinutes).toBe(90);
  });
});
