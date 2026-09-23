import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-174: 営業日外の提出が翌営業日扱いに自動切り替えられる', () => {
  it('営業日外（休業日）の提出が翌営業日扱いに自動切り替えられる', async () => {
    // 営業日カレンダーを設定済み状態：2024-01-06は休業日
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-06',
      teamLeaderId: 'leader001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-06T10:00:00Z',
    };

    // 関数を呼び出す
    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    // 期待される出力を検証
    expect(result.isAcceptable).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinDeadline).toBeNull();
    expect(result.submissionDeadlineForTargetDate).toBeNull();
    expect(result.processingPolicy).toBe('defer_to_next_business_day');
    expect(result.rejectionReason).toBe('営業日外');
  });
});
