import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<any>('../../src/logic/business-day-deadline-judgment'),
  isWithinSubmissionDeadline: jest.fn().mockImplementation(async () => ({
    isWithinDeadline: true,
    submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
    minutesUntilDeadline: -30,
  })),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<any>('../../src/logic/daily-report-persistence'),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockImplementation(async () => ({ detectionLogs: [], totalCount: 0, retrievedAt: '2024-01-15T18:30:00Z' })),
}));

import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  InvalidDeadlineConfiguration,
} from '../../src/logic/non-submission-prompt-decision';

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

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      new InvalidDeadlineConfiguration('提出期限の設定が不正です。')
    );
  });
});
