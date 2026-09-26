import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment');

import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

const mockedIsWithinSubmissionDeadline = businessDayModule.isWithinSubmissionDeadline as jest.MockedFunction<any>;

describe('SCEN-277: 連続未提出日数が2日以上の場合、中以上の優先度で催促が必要と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('連続未提出日数が2日以上となるシナリオで、isPromptNecessaryがtrue、promptPriorityが「medium」以上である', async () => {
    const input = {
      userId: 'test-user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:35:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    mockedIsWithinSubmissionDeadline.mockReturnValue(false);

    const result = await judgePromptNecessityAndMethod(input);

    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('medium');
    expect(['email_and_system_notification', 'escalate_to_leader']).toContain(result.promptMethod);
    expect(result.suggestedPromptMessage).toContain('催促');
    expect(result.overdueDurationMinutes).toBe(35);
  });
});
