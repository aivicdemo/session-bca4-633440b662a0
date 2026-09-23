import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-178: 提出日時が過去30日以上前のとき警告が発生する', () => {
  it('提出日時が過去30日以上前である場合、警告が発生する', async () => {
    // 当日から30日以上前の日付を指定
    // 例：今日が2024-01-15の場合、2023-12-15以前の日付
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2023-12-15',
      teamLeaderId: 'TL001',
      reporterUserId: 'RPT001',
      submissionAttemptTimestamp: '2023-12-15T09:00:00Z',
    };

    // 関数を呼び出す
    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    // 期待される出力を検証
    expect(result.isAcceptable).toBe(false);
    expect(result.isWithinDeadline).toBe(false);

    // 業務ルール br-tx_4-008 の制約に基づき、
    // 警告「提出日時が過去30日以上前です。本当に提出しますか？」が含まれることを確認
    expect(result.rejectionReason).toBeDefined();
    expect(result.rejectionReason).toContain('30日以上前');
  });

  it('提出日時が過去30日以上前である場合、processingPolicyが適切に設定される', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2023-12-10',
      teamLeaderId: 'TL001',
      reporterUserId: 'RPT001',
      submissionAttemptTimestamp: '2023-12-10T09:00:00Z',
    };

    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    // processingPolicyが'reject'または'defer_to_next_business_day'のいずれかであること
    expect(['reject', 'defer_to_next_business_day']).toContain(result.processingPolicy);
  });
});
