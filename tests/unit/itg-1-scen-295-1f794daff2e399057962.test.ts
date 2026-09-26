import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-295: 複数回のリマインダー送信と期限超過時間の組み合わせで、適切な催促メッセージが生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数回のリマインダー送信（2回）と90分の期限超過で、high優先度とescalate_to_leaderの催促が生成され、suggestedPromptMessageが業務上妥当な催促メッセージとして生成される', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 2,
      previousReminderSentDateTime: '2024-01-15T17:45:00Z',
    };

    const result = await judgePromptNecessityAndMethod(input);

    // 出力型 JudgePromptNecessityAndMethodOutput のすべてのフィールドが正常に入力される
    expect(result).toBeDefined();
    expect(result).toHaveProperty('isPromptNecessary');
    expect(result).toHaveProperty('promptPriority');
    expect(result).toHaveProperty('promptMethod');
    expect(result).toHaveProperty('estimatedNonSubmissionReason');
    expect(result).toHaveProperty('overdueDurationMinutes');
    expect(result).toHaveProperty('suggestedPromptMessage');

    // 業務ルール br-tx_3-003 に従い、超過時間90分は60分以上なので promptPriority は 'high'
    expect(result.promptPriority).toBe('high');

    // 業務ルール br-tx_5-004 に従い、複数回のリマインダー送信（previousReminderSentCount=2）と30分以上の期限超過により、催促が必要な状態として isPromptNecessary が true
    expect(result.isPromptNecessary).toBe(true);

    // 複数回のリマインダー送信実績（previousReminderSentCount=2 >= 2）から、promptMethod が 'escalate_to_leader'
    expect(result.promptMethod).toBe('escalate_to_leader');

    // overdueDurationMinutes が90（分単位の超過時間）
    expect(result.overdueDurationMinutes).toBe(90);

    // suggestedPromptMessage が業務上妥当な催促判定支援メッセージとして生成されている
    expect(result.suggestedPromptMessage).toBeDefined();
    expect(typeof result.suggestedPromptMessage).toBe('string');
    expect(result.suggestedPromptMessage.length).toBeGreaterThan(0);
  });

  it('複数回のリマインダー送信（2回）と90分の期限超過の条件で、関数は正常に完了しエラーが発生しない', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 2,
      previousReminderSentDateTime: '2024-01-15T17:45:00Z',
    };

    const result = await judgePromptNecessityAndMethod(input);

    // エラーが発生せず、結果が返される
    expect(result).toBeDefined();
    expect(result.overdueDurationMinutes).toBe(90);
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('high');
    expect(result.promptMethod).toBe('escalate_to_leader');
  });
});
