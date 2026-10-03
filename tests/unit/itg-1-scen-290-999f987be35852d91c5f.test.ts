import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<any>('../../src/logic/business-day-deadline-judgment'),
  isWithinSubmissionDeadline: jest.fn().mockImplementation(async () => ({
    isWithinDeadline: true,
    submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
    minutesUntilDeadline: 0,
  })),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<any>('../../src/logic/daily-report-persistence'),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockImplementation(async () => ({ detectionLogs: [], totalCount: 0, retrievedAt: '2024-01-15T17:35:00Z' })),
}));

import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  InvalidNonSubmitterInput,
} from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-290: メンバーIDが空またはシステムに存在しない場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メンバーIDが空文字列の場合、InvalidNonSubmitterInputエラーが発生し、エラー文言が正しい', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: '',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:35:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      new InvalidNonSubmitterInput('未提出者情報の必須項目が不足しているか形式が不正です。')
    );
  });

  it('メンバーIDがシステムに存在しない場合、InvalidNonSubmitterInputエラーが発生し、エラー文言が正しい', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'nonexistent-member-9999',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:35:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      new InvalidNonSubmitterInput('未提出者情報の必須項目が不足しているか形式が不正です。')
    );
  });
});
