import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  PromptDecisionProcessingError,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-292: 催促判定処理中にシステムエラーが発生した場合、PromptDecisionProcessingErrorエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('催促判定処理内でエラーが発生した場合、PromptDecisionProcessingErrorエラーがスローされ、エラー文言が正しい', async () => {
    // テストダブルの準備：isWithinSubmissionDeadline をモック化し、エラーを返すよう設定
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<any>;
    mockIsWithinSubmissionDeadline.mockRejectedValue(
      new Error('Database connection failed')
    );

    // 入力値
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-123',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // 関数呼び出し時にPromptDecisionProcessingErrorがスローされることを検証
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(PromptDecisionProcessingError);

    try {
      await judgePromptNecessityAndMethod(input);
    } catch (error) {
      if (error instanceof PromptDecisionProcessingError) {
        expect(error.message).toBe('催促判定処理中にエラーが発生しました。');
      } else {
        throw error;
      }
    }
  });
});
