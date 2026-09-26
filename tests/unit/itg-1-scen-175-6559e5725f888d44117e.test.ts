import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-175: 期限超過の提出が翌営業日扱いに自動切り替えられる', () => {
  it('期限超過（18:30は17:00の期限を90分超過）の提出が翌営業日扱いに自動切り替えられる', async () => {
    // 営業日カレンダーを設定：2025-01-17（金・営業日）
    // チームリーダー（teamLeaderId='TL001'）が日報提出期限を『毎営業日17:00』に設定済み
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2025-01-17',
      teamLeaderId: 'TL001',
      reporterUserId: 'RPT001',
      submissionAttemptTimestamp: '2025-01-17T18:30:00Z',
    };

    // 関数を呼び出す
    const result = await judgeBusinessDayAndDeadline(input);

    // 期待される出力を検証
    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.submissionDeadlineForTargetDate).toBe('2025-01-17T17:00:00Z');
    expect(result.processingPolicy).toBe('defer_to_next_business_day');
    expect(result.rejectionReason).toBe('期限超過');
  });
});
