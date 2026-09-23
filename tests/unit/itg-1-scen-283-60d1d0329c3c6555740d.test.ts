import { describe, it, expect, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-283: 兆候が判断できない場合、推測理由に「unknown」が設定される', () => {
  it('検知日時が期限前の場合、推測理由は「unknown」で催促は不要と判定される', async () => {
    // 入力値を設定：検知日時が期限前、リマインダー送信履歴なし
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user001',
      targetDate: '2025-01-15',
      detectionDateTime: '2025-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // isWithinSubmissionDeadline をスタブ化：期限前を示す
    const mockIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.MockedFunction<typeof isWithinSubmissionDeadline>;
    mockIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2025-01-15T17:00:00Z',
      minutesUntilDeadline: 30,
    });

    // 関数を呼び出す
    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    // 期待結果を確認
    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.promptMethod).toBe('email');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');
    expect(result.overdueDurationMinutes).toBeLessThan(0);
    expect(result.suggestedPromptMessage).toBeTruthy();
    expect(result.suggestedPromptMessage).toContain('未提出理由が判断できません');
  });
});
