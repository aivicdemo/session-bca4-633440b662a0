import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  InvalidDeadlineConfiguration,
} from '../../src/logic/non-submission-prompt-decision';

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  isWithinSubmissionDeadline: jest.fn(),
}));

describe('SCEN-289: 提出期限の時刻がHH:MM形式以外の場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('提出期限の時刻がHH:MM形式以外の場合、InvalidDeadlineConfigurationエラーが発生し、エラー文言が正しい', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:30:00Z',
      submissionDeadlineTime: '17:3',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidDeadlineConfiguration);

    try {
      await judgePromptNecessityAndMethod(input);
    } catch (error) {
      if (error instanceof InvalidDeadlineConfiguration) {
        expect(error.message).toBe('提出期限の設定が不正です。');
      } else {
        throw error;
      }
    }
  });
});
