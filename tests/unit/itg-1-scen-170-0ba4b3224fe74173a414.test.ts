import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-170: 営業日かつ期限内の提出で日報が受け付けられる', () => {
  it('営業日かつ期限内の提出で日報が受け付けられる', async () => {
    // 入力値：営業日カレンダーに2024-01-15（月）を営業日として設定
    // チームリーダーのユーザーID「TL-001」に対して、日報提出期限を17:00に定義
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'TL-001',
      reporterUserId: 'RPT-001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
    };

    // 関数を呼び出す
    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    // 期待される出力を検証
    expect(result.isAcceptable).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinDeadline).toBe(true);
    expect(result.submissionDeadlineForTargetDate).toBe('2024-01-15T17:00:00Z');
    expect(result.processingPolicy).toBe('accept');
    expect(result.rejectionReason).toBeNull();
  });
});
