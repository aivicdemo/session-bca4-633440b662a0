import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  InvalidTargetDate,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-173: 対象日付が不正な形式または範囲外の場合にエラーが発生する', () => {
  const validTeamLeaderId = 'TL-001';
  const validReporterId = 'RPT-001';
  const validTimestamp = '2024-01-15T16:30:00Z';

  it('不正な形式「2024-13-45」でエラーが発生する', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-13-45',
      teamLeaderId: validTeamLeaderId,
      reporterUserId: validReporterId,
      submissionAttemptTimestamp: validTimestamp,
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(InvalidTargetDate);
  });

  it('不正な形式「2024/01/01」でエラーが発生する', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024/01/01',
      teamLeaderId: validTeamLeaderId,
      reporterUserId: validReporterId,
      submissionAttemptTimestamp: validTimestamp,
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(InvalidTargetDate);
  });

  it('不正な形式「invalid-date」でエラーが発生する', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: 'invalid-date',
      teamLeaderId: validTeamLeaderId,
      reporterUserId: validReporterId,
      submissionAttemptTimestamp: validTimestamp,
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(InvalidTargetDate);
  });

  it('空文字列でエラーが発生する', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '',
      teamLeaderId: validTeamLeaderId,
      reporterUserId: validReporterId,
      submissionAttemptTimestamp: validTimestamp,
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(InvalidTargetDate);
  });

  it('エラーメッセージが正しいこと', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-13-45',
      teamLeaderId: validTeamLeaderId,
      reporterUserId: validReporterId,
      submissionAttemptTimestamp: validTimestamp,
    };

    try {
      await judgeBusinessDayAndDeadline(input);
      throw new Error('Expected InvalidTargetDate to be thrown');
    } catch (error) {
      if (error instanceof InvalidTargetDate) {
        expect(error.message).toBe('対象日付が不正です。');
      } else {
        throw error;
      }
    }
  });
});
