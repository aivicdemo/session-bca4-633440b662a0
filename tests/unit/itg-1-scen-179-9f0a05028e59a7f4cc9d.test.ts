import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  JudgeBusinessDayAndDeadlineOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-179: 営業日かつ期限内で isAcceptable が true、processingPolicy が accept になる', () => {
  it('営業日かつ期限内の提出で全フィールドが正しく設定される', async () => {
    // 営業日カレンダーが設定済みで、指定日付（2024-01-15）が営業日として登録
    // チームリーダーが日報提出期限を定義済みで、期限時刻が 17:00 に設定
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
    };

    // 関数を呼び出す
    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    // 戻り値の全フィールドを検証
    expect(result.isAcceptable).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinDeadline).toBe(true);
    expect(result.submissionDeadlineForTargetDate).toBe('2024-01-15T17:00:00Z');
    expect(result.processingPolicy).toBe('accept');
    expect(result.rejectionReason).toBeNull();
  });

  it('期限内の提出であることが複数のケースで確認される', async () => {
    // 別のケース：期限までに余裕がある場合
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-15T15:00:00Z',
    };

    const result: JudgeBusinessDayAndDeadlineOutput = await judgeBusinessDayAndDeadline(input);

    expect(result.isAcceptable).toBe(true);
    expect(result.isWithinDeadline).toBe(true);
    expect(result.processingPolicy).toBe('accept');
  });
});
