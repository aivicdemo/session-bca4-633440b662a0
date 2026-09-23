import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  InvalidNonSubmitterInput,
} from '../../src/logic/non-submission-prompt-decision';

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  isWithinSubmissionDeadline: jest.fn(),
}));

describe('SCEN-288: 報告者IDが空または存在しない場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('userId が空文字列の場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: '',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:00:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidNonSubmitterInput);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      '未提出者情報の必須項目が不足しているか形式が不正です。'
    );
  });
});
