import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
} from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-294: 超過時間がマイナス値（期限前）の場合、overdueDurationMinutesに負の値が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('テスト対象の関数judgePromptNecessityAndMethodを呼び出し、入力値を期限前（16:30、期限17:00の30分前）で構成し、呼び出し先isWithinSubmissionDeadlineをスタブ化して期限前判定を返した場合、overdueDurationMinutesに-30が設定される', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    const result = await judgePromptNecessityAndMethod(input);

    // 業務ルール br-tx_3-003 の計算式：minutesOverdue = (currentTime - reportDeadline) / 60
    // 検知時刻（16:30）から期限時刻（17:00）を引くと -30 分となり、期限前の状態を正確に表現する
    expect(result.overdueDurationMinutes).toBe(-30);

    // 期限前を前提とした値
    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');

    // エラーが発生しないこと
    expect(result).toBeDefined();
  });
});
