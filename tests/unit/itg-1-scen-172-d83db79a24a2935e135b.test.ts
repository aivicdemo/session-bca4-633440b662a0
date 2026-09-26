import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  SubmissionDeadlineNotDefined,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-172: チームリーダーが日報提出期限を未定義の場合にエラーが発生する', () => {
  it('チームリーダーの日報提出期限が未定義の場合にSubmissionDeadlineNotDefinedエラーが発生する', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'leader-with-no-deadline',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-15T16:00:00Z',
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(
      SubmissionDeadlineNotDefined
    );

    try {
      await judgeBusinessDayAndDeadline(input);
    } catch (error) {
      expect(error).toBeInstanceOf(SubmissionDeadlineNotDefined);
      expect(error.message).toBe('日報提出期限が未定義のため判定できません。');
    }
  });
});
