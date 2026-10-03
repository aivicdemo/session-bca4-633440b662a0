import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<any>('../../src/logic/business-day-deadline-judgment'),
  isWithinSubmissionDeadline: jest.fn().mockImplementation(async () => ({
    isWithinDeadline: true,
    submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
    minutesUntilDeadline: 30,
  })),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<any>('../../src/logic/daily-report-persistence'),
  retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockImplementation(async () => ({ detectionLogs: [], totalCount: 0, retrievedAt: '2024-01-15T16:30:00Z' })),
}));

import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
} from '../../src/logic/non-submission-prompt-decision';
import * as businessDayDeadlineJudgment from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-294: 超過時間がマイナス値（期限前）の場合、overdueDurationMinutesに負の値が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('テスト対象の関数judgePromptNecessityAndMethodを呼び出し、入力値を期限前（16:30、期限17:00の30分前）で構成した場合、overdueDurationMinutesに-30が設定される', async () => {
    const mockIsWithinSubmissionDeadline = businessDayDeadlineJudgment.isWithinSubmissionDeadline as jest.MockedFunction<any>;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: 30,
    });

    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    const result = await judgePromptNecessityAndMethod(input);

    // 業務ルール br-tx_3-003 の計算式に従い、負の値が設定される
    expect(result.overdueDurationMinutes).toBe(-30);

    // 期限前を前提とした値
    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');

    // エラーが発生しないこと
    expect(result).toBeDefined();
  });
});
