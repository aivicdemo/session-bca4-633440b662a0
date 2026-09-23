import { describe, it, expect, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  PromptDecisionProcessingError,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-293: 呼び出し処理isWithinSubmissionDeadlineが失敗した場合、PromptDecisionProcessingErrorエラーが発生する', () => {
  it('isWithinSubmissionDeadlineがエラーをスロー（ネットワークエラー）した場合、PromptDecisionProcessingErrorがスローされる', async () => {
    // スタブ化したisWithinSubmissionDeadline関数を、呼び出し時にエラーをスロー（ネットワークエラー）するよう設定
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<typeof isWithinSubmissionDeadline>;
    mockIsWithinSubmissionDeadline.mockRejectedValue(
      new Error('Network error')
    );

    // 有効な入力で関数を呼び出す
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'USER001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // isWithinSubmissionDeadlineの呼び出しが実行され、スタブが設定したエラーが発生、
    // judgePromptNecessityAndMethodがエラーをキャッチしてPromptDecisionProcessingErrorを発生させることを検証
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      PromptDecisionProcessingError
    );
  });

  it('isWithinSubmissionDeadlineがエラーをスロー（タイムアウト）した場合、PromptDecisionProcessingErrorがスローされる', async () => {
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<typeof isWithinSubmissionDeadline>;
    mockIsWithinSubmissionDeadline.mockRejectedValue(
      new Error('Timeout exceeded')
    );

    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'USER001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      PromptDecisionProcessingError
    );
  });

  it('isWithinSubmissionDeadlineがエラーをスロー（予期しない例外）した場合、PromptDecisionProcessingErrorがスローされ、エラー文言が正しい', async () => {
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<typeof isWithinSubmissionDeadline>;
    mockIsWithinSubmissionDeadline.mockRejectedValue(
      new Error('Unexpected exception')
    );

    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'USER001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    try {
      await judgePromptNecessityAndMethod(input);
      // エラーがスローされなかった場合は失敗
      expect(true).toBe(false);
    } catch (error) {
      // PromptDecisionProcessingErrorが発生したことを検証
      expect(error).toBeInstanceOf(PromptDecisionProcessingError);
      // エラー文言を検証
      expect((error as PromptDecisionProcessingError).message).toBe(
        '催促判定処理中にエラーが発生しました。'
      );
    }
  });
});
