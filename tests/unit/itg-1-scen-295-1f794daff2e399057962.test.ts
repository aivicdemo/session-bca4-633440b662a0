jest.mock('../../src/logic/business-day-deadline-judgment');

import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  JudgePromptNecessityAndMethodOutput,
} from '../../src/logic/non-submission-prompt-decision';
import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';

const mockedIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.Mock;

describe('SCEN-295: 複数回のリマインダー送信と期限超過時間の組み合わせで、適切な催促メッセージが生成される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('複数回のリマインダー送信（2回）と90分の期限超過で、medium優先度とメール+システム通知の催促が生成される', async () => {
    // Arrange: 期限超過状態を示す戻り値 false を返すようにスタブ化
    mockedIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: false,
      overdueDurationMinutes: 90,
      deadlineExceededAt: new Date('2024-01-15T18:30:00Z'),
    });

    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 2,
      previousReminderSentDateTime: '2024-01-15T17:45:00Z',
    };

    // Act: 関数を呼び出す
    const result = await judgePromptNecessityAndMethod(input);

    // Assert: 出力型 JudgePromptNecessityAndMethodOutput のすべてのフィールドが正常に入力される
    expect(result).toBeDefined();
    expect(result).toHaveProperty('isPromptNecessary');
    expect(result).toHaveProperty('promptPriority');
    expect(result).toHaveProperty('promptMethod');
    expect(result).toHaveProperty('estimatedNonSubmissionReason');
    expect(result).toHaveProperty('overdueDurationMinutes');
    expect(result).toHaveProperty('suggestedPromptMessage');

    // 業務ルール br-tx_3-003 の計算式に従い、超過時間90分は120分以下であるため promptPriority は 'medium'
    expect(result.promptPriority).toBe('medium');

    // 業務ルール br-tx_5-004 に従い、複数回のリマインダー送信（previousReminderSentCount=2）と30分以上の期限超過により、催促が必要な状態として isPromptNecessary が true
    expect(result.isPromptNecessary).toBe(true);

    // 複数回のリマインダー送信実績と medium 優先度の組み合わせから、promptMethod が 'email_and_system_notification'（メール+システム通知）
    expect(result.promptMethod).toBe('email_and_system_notification');

    // estimatedNonSubmissionReason は複数回リマインダー送信履歴に基づいて 'business_busy' または 'input_forgotten' のいずれか
    expect(['business_busy', 'input_forgotten']).toContain(result.estimatedNonSubmissionReason);

    // overdueDurationMinutes が90（分単位の超過時間）
    expect(result.overdueDurationMinutes).toBe(90);

    // suggestedPromptMessage が業務上妥当な催促判定支援メッセージとして生成されている
    expect(result.suggestedPromptMessage).toBeDefined();
    expect(typeof result.suggestedPromptMessage).toBe('string');
    expect(result.suggestedPromptMessage.length).toBeGreaterThan(0);

    // メッセージに重要な情報が含まれていることを確認（期限超過情報）
    expect(result.suggestedPromptMessage).toMatch(/期限超過|超過|リマインダー|催促/);
  });

  it('関数は正常に完了し、エラーが発生しない', async () => {
    // Arrange
    mockedIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: false,
      overdueDurationMinutes: 90,
      deadlineExceededAt: new Date('2024-01-15T18:30:00Z'),
    });

    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T18:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 2,
      previousReminderSentDateTime: '2024-01-15T17:45:00Z',
    };

    // Act
    const result = await judgePromptNecessityAndMethod(input);

    // Assert: エラーが発生せず、結果が返される
    expect(result).toBeDefined();
    expect(result.overdueDurationMinutes).toBe(90);
    expect(result.isPromptNecessary).toBe(true);
    expect(result.promptPriority).toBe('medium');
    expect(result.promptMethod).toBe('email_and_system_notification');
  });
});
