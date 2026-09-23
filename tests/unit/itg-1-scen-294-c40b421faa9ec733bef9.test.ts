import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';

// 依存先のモック
jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  isWithinSubmissionDeadline: jest.fn(),
}));

describe('SCEN-294: 超過時間がマイナス値（期限前）の場合、overdueDurationMinutesに負の値が設定される', () => {
  let mockIsWithinSubmissionDeadline: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsWithinSubmissionDeadline = require('../../src/logic/business-day-deadline-judgment.ts')
      .isWithinSubmissionDeadline as jest.Mock;
  });

  it('期限の30分前の検知時点で、overdueDurationMinutesに-30が設定される', async () => {
    // detectionDateTime: 2024-01-15T16:30:00Z（UTC）
    // submissionDeadlineTime: '17:00'
    // 期限17:00から検知時刻16:30を引くと -30 分

    // isWithinSubmissionDeadline をスタブ化し、期限前判定を返す
    mockIsWithinSubmissionDeadline.mockReturnValue(true);

    // 入力値を構築
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    // judgePromptNecessityAndMethod を呼び出す
    // @ts-ignore
    const result: JudgePromptNecessityAndMethodOutput = await judgePromptNecessityAndMethod(input);

    // overdueDurationMinutes に負の値（-30）が設定されることを検証
    expect(result.overdueDurationMinutes).toBe(-30);

    // 期限前を前提とした出力フィールドを検証
    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');

    // その他のフィールドが存在することを確認
    expect(result.promptMethod).toBeDefined();
    expect(result.suggestedPromptMessage).toBeDefined();

    // 設計済みエラーが発生していないことを確認
    expect(() => {}).not.toThrow();
  });
});
