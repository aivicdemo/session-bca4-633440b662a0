import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');

import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

const mockedIsWithinSubmissionDeadline = businessDayModule.isWithinSubmissionDeadline as jest.MockedFunction<any>;

describe('SCEN-278: 連続未提出日数が3日以上の場合、高優先度でエスカレーション方法を提案する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('連続未提出日数が3日以上の場合、promptPriorityが「high」、promptMethodが「escalate_to_leader」である', async () => {
    const input = {
      userId: 'user-001',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T20:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 2,
      previousReminderSentDateTime: '2025-01-15T18:00:00Z',
    };

    mockedIsWithinSubmissionDeadline.mockReturnValue(false);

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(['business_busy', 'system_issue', 'input_forgotten', 'unknown']).toContain(result.estimatedNonSubmissionReason);
    expect(result.suggestedPromptMessage).toContain('3日');
    expect(result.suggestedPromptMessage).toContain('リーダー');
    expect(result.overdueDurationMinutes).toBe(210);
  });
});
