import { describe, it, expect, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  PromptDecisionProcessingError,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-292: 催促判定処理中にシステムエラーが発生した場合、PromptDecisionProcessingErrorエラーが発生する', () => {
  it('催促判定処理内でエラーが発生した場合、PromptDecisionProcessingErrorエラーがスローされる', async () => {
    // テストダブルの準備：isWithinSubmissionDeadline をスタブ化し、正常な戻り値を返すよう設定
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<typeof isWithinSubmissionDeadline>;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2025-01-15T17:00:00Z',
      minutesUntilDeadline: -45,
    });

    // 入力値：期限超過のシナリオを設定
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-123',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // 催促判定処理内でエラーをスロー（例：データベース接続失敗、タイムアウト等）するようモック設定
    // judgePromptNecessityAndMethodの実装内でエラーが発生するシナリオを再現
    mockIsWithinSubmissionDeadline.mockRejectedValueOnce(
      new Error('Database connection failed')
    );

    // 関数呼び出し時にPromptDecisionProcessingErrorがスローされることを検証
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(PromptDecisionProcessingError);
  });

  it('スローされたPromptDecisionProcessingErrorのメッセージが正しい', async () => {
    // テストダブルの準備
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<typeof isWithinSubmissionDeadline>;
    mockIsWithinSubmissionDeadline.mockRejectedValue(
      new Error('Processing failed')
    );

    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-123',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // エラーのメッセージを検証
    try {
      await judgePromptNecessityAndMethod(input);
      // エラーがスローされなかった場合は失敗
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(PromptDecisionProcessingError);
      expect((error as PromptDecisionProcessingError).message).toBe(
        '催促判定処理中にエラーが発生しました。'
      );
    }
  });
});
