import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  isWithinSubmissionDeadline: jest.fn(),
}));

describe('SCEN-291: 連続未提出日数が負の数の場合、0以上にクランプされて処理が続行される', () => {
  let mockIsWithinSubmissionDeadline: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsWithinSubmissionDeadline = require('../../src/logic/business-day-deadline-judgment.ts')
      .isWithinSubmissionDeadline as jest.Mock;
    // overdueDurationMinutes=70 を返すようにモックを設定（期限超過1時間以上）
    // @ts-ignore
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: false,
      overdueDurationMinutes: 70,
    });
  });

  it('連続未提出日数が-1（負の数）の場合、内部的に0にクランプされた状態で処理が続行され、isPromptNecessary=trueが返される', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:00:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
      continuousNonSubmissionDays: -1,
    } as any;

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    // エラーは発生せず、処理は正常完了
    expect(result).toBeDefined();

    // isPromptNecessary=trueが返される
    expect(result.isPromptNecessary).toBe(true);

    // promptPriority='high'（期限超過1時間以上）
    expect(result.promptPriority).toBe('high');

    // promptMethod='email_and_system_notification'
    expect(result.promptMethod).toBe('email_and_system_notification');

    // 他のフィールドも返される
    expect(result.estimatedNonSubmissionReason).toBeDefined();
    expect(result.suggestedPromptMessage).toBeDefined();
    expect(result.overdueDurationMinutes).toBe(70);
  });
});
