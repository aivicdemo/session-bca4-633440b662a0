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

  it('報告者IDが空文字列である入力でジャッジ処理を実行すると、InvalidNonSubmitterInputエラーが発生し、エラー文言が正しい', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: '',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:00:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidNonSubmitterInput);

    try {
      await judgePromptNecessityAndMethod(input);
    } catch (error) {
      if (error instanceof InvalidNonSubmitterInput) {
        expect(error.message).toBe('未提出者情報の必須項目が不足しているか形式が不正です。');
      } else {
        throw error;
      }
    }
  });
});
