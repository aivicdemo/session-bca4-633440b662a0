import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  PromptDecisionProcessingError,
} from '../../src/logic/non-submission-prompt-decision';

jest.mock('../../src/logic/business-day-deadline-judgment');
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<any>;

describe('SCEN-293: 呼び出し処理isWithinSubmissionDeadlineが失敗した場合、PromptDecisionProcessingErrorエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('スタブ化したisWithinSubmissionDeadline関数がエラーをスロー（ネットワークエラー）するよう設定し、judgePromptNecessityAndMethodを呼び出した場合、PromptDecisionProcessingErrorが発生し、エラー文言は「催促判定処理中にエラーが発生しました。」である', async () => {
    mockIsWithinSubmissionDeadline.mockRejectedValueOnce(
      new Error('Network error')
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
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      '催促判定処理中にエラーが発生しました。'
    );
  });

  it('スタブ化したisWithinSubmissionDeadline関数がエラーをスロー（タイムアウト）するよう設定し、judgePromptNecessityAndMethodを呼び出した場合、PromptDecisionProcessingErrorが発生する', async () => {
    mockIsWithinSubmissionDeadline.mockRejectedValueOnce(
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

  it('スタブ化したisWithinSubmissionDeadline関数がエラーをスロー（予期しない例外）するよう設定し、judgePromptNecessityAndMethodを呼び出した場合、PromptDecisionProcessingErrorが発生し、エラー文言は「催促判定処理中にエラーが発生しました。」である', async () => {
    mockIsWithinSubmissionDeadline.mockRejectedValueOnce(
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

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      PromptDecisionProcessingError
    );
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      '催促判定処理中にエラーが発生しました。'
    );
  });
});
