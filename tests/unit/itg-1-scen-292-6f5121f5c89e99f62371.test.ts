import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<any>('../../src/logic/business-day-deadline-judgment'),
  isWithinSubmissionDeadline: jest.fn().mockImplementation(async () => ({
    isWithinDeadline: true,
    submissionDeadlineForTargetDate: '2025-01-15T17:00:00Z',
    minutesUntilDeadline: 0,
  })),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<any>('../../src/logic/daily-report-persistence'),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockImplementation(async () => ({ detectionLogs: [], totalCount: 0, retrievedAt: '2025-01-15T17:45:00Z' })),
}));

import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  PromptDecisionProcessingError,
} from '../../src/logic/non-submission-prompt-decision';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-292: 催促判定処理中にシステムエラーが発生した場合、PromptDecisionProcessingErrorエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('催促判定処理内でエラーが発生した場合、PromptDecisionProcessingErrorエラーがスローされ、エラー文言が正しい', async () => {
    const mockIsWithinSubmissionDeadline = businessDayDeadlineJudgment.isWithinSubmissionDeadline as jest.MockedFunction<any>;
    mockIsWithinSubmissionDeadline.mockRejectedValue(
      new Error('Database connection failed')
    );

    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-123',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      new PromptDecisionProcessingError('催促判定処理中にエラーが発生しました。')
    );
  });
});
