import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  InvalidDeadlineConfiguration,
} from '../../src/logic/non-submission-prompt-decision';

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  isWithinSubmissionDeadline: jest.fn(),
}));

describe('SCEN-286: 提出期限の設定が不正な場合、InvalidDeadlineConfigurationエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submissionDeadlineTime が "25:00" の場合、InvalidDeadlineConfiguration エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:00:00Z',
      submissionDeadlineTime: '25:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidDeadlineConfiguration);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow('提出期限の設定が不正です。');
  });

  it('submissionDeadlineTime が "17:60" の場合、InvalidDeadlineConfiguration エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:00:00Z',
      submissionDeadlineTime: '17:60',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidDeadlineConfiguration);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow('提出期限の設定が不正です。');
  });

  it('submissionDeadlineTime が "abc" の場合、InvalidDeadlineConfiguration エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:00:00Z',
      submissionDeadlineTime: 'abc',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidDeadlineConfiguration);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow('提出期限の設定が不正です。');
  });
});
