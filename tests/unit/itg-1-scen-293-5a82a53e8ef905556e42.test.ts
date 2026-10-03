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
  retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockImplementation(async () => ({ detectionLogs: [], totalCount: 0, retrievedAt: '2024-01-15T17:45:00Z' })),
}));

import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  PromptDecisionProcessingError,
} from '../../src/logic/non-submission-prompt-decision';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-293: 呼び出し処理isWithinSubmissionDeadlineが失敗した場合、PromptDecisionProcessingErrorエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('スタブ化したisWithinSubmissionDeadline関数がエラーをスロー（ネットワークエラー）するよう設定した場合、PromptDecisionProcessingErrorが発生し、エラー文言は「催促判定処理中にエラーが発生しました。」である', async () => {
    const mockIsWithinSubmissionDeadline = businessDayDeadlineJudgment.isWithinSubmissionDeadline as jest.MockedFunction<any>;
    mockIsWithinSubmissionDeadline.mockRejectedValue(
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
      new PromptDecisionProcessingError('催促判定処理中にエラーが発生しました。')
    );
  });

  it('スタブ化したisWithinSubmissionDeadline関数がエラーをスロー（タイムアウト）するよう設定した場合、PromptDecisionProcessingErrorが発生する', async () => {
    const mockIsWithinSubmissionDeadline = businessDayDeadlineJudgment.isWithinSubmissionDeadline as jest.MockedFunction<any>;
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
      new PromptDecisionProcessingError('催促判定処理中にエラーが発生しました。')
    );
  });

  it('スタブ化したisWithinSubmissionDeadline関数がエラーをスロー（予期しない例外）するよう設定した場合、PromptDecisionProcessingErrorが発生し、エラー文言は「催促判定処理中にエラーが発生しました。」である', async () => {
    const mockIsWithinSubmissionDeadline = businessDayDeadlineJudgment.isWithinSubmissionDeadline as jest.MockedFunction<any>;
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

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      new PromptDecisionProcessingError('催促判定処理中にエラーが発生しました。')
    );
  });
});
