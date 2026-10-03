import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-177: 日報提出期限の時刻形式が不正のとき例外がスローされる', () => {
  it('日報提出期限の時刻形式が不正の場合にエラーがスローされる', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'TL001-invalid-deadline-format',
      reporterUserId: 'R001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(
      '期限時刻の形式が不正です。HH:MM形式で設定してください'
    );
  });
});
