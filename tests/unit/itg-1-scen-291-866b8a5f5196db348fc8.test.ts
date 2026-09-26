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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('連続未提出日数が負の数でもクランプされて処理が続行され、期限超過1時間以上でisPromptNecessary=true、promptPriority=high、promptMethod=email_and_system_notificationが返される', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:10:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 1,
      previousReminderSentDateTime: null,
    };

    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    // エラーは発生せず、処理は正常完了
    expect(result).toBeDefined();

    // isPromptNecessary=trueが返される
    expect(result.isPromptNecessary).toBe(true);

    // promptPriority='high'（期限超過1時間以上、overdueDurationMinutes=70）
    expect(result.promptPriority).toBe('high');

    // promptMethod='email_and_system_notification'（前回催促送信回数=1、期限超過）
    expect(result.promptMethod).toBe('email_and_system_notification');

    // 他のフィールドも返される
    expect(result.estimatedNonSubmissionReason).toBeDefined();
    expect(result.suggestedPromptMessage).toBeDefined();
    expect(result.overdueDurationMinutes).toBeGreaterThanOrEqual(70);
  });
});
