import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeBusinessDayAndDeadline, SubmissionDeadlineNotDefined } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-172: チームリーダーが日報提出期限を未定義の場合にエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームリーダーの日報提出期限が未定義の状態でSubmissionDeadlineNotDefinedエラーが発生する', async () => {
    const input = {
      targetDate: '2024-01-15',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-15T16:00:00Z'
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(SubmissionDeadlineNotDefined);
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow('日報提出期限が未定義のため判定できません。');
  });
});
