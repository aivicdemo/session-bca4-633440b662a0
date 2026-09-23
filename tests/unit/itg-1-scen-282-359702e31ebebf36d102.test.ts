import { describe, it, expect, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-282: 入力忘れの兆候が検出された場合、推測理由に「input_forgotten」が設定される', () => {
  it('提出期限1時間45分超過時に入力忘れの兆候で「input_forgotten」が設定される', async () => {
    // 入力値を設定
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:45:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // isWithinSubmissionDeadline をスタブ化
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<typeof isWithinSubmissionDeadline>;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: false,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00Z',
      minutesUntilDeadline: -105,
    });

    // 関数を呼び出す
    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    // 期待結果を確認
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
    expect(result.estimatedNonSubmissionReason).toBe('input_forgotten');
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.suggestedPromptMessage).toContain('入力忘れ');
    expect(result.overdueDurationMinutes).toBe(105);
  });
});
