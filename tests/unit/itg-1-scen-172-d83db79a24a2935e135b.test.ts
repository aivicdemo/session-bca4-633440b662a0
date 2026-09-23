import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  SubmissionDeadlineNotDefined,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-172: チームリーダーが日報提出期限を未定義の場合にエラーが発生する', () => {
  it('チームリーダーが日報提出期限を未定義の場合にエラーが発生する', async () => {
    // テスト前提条件：営業日カレンダーは設定済み
    // チームリーダーの日報提出期限が未定義（null または undefined）の状態
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'leader-exists-but-no-deadline',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-15T16:00:00Z',
    };

    // SubmissionDeadlineNotDefined エラーが発生することを期待
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(
      SubmissionDeadlineNotDefined
    );
  });

  it('エラーメッセージが正しいこと', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'leader-exists-but-no-deadline',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-15T16:00:00Z',
    };

    try {
      await judgeBusinessDayAndDeadline(input);
      throw new Error('Expected SubmissionDeadlineNotDefined to be thrown');
    } catch (error) {
      if (error instanceof SubmissionDeadlineNotDefined) {
        expect(error.message).toBe('日報提出期限が未定義のため判定できません。');
      } else {
        throw error;
      }
    }
  });
});
