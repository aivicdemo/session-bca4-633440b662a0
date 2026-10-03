import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeBusinessDayAndDeadline, InvalidTargetDate } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-173: 対象日付が不正な形式または範囲外の場合にエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('targetDateが不正な形式"2024-13-45"の場合にInvalidTargetDateエラーが発生する', async () => {
    const input = {
      targetDate: '2024-13-45',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z'
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(InvalidTargetDate);
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow('対象日付が不正です。');
  });

  it('targetDateが不正な形式"2024/01/01"の場合にInvalidTargetDateエラーが発生する', async () => {
    const input = {
      targetDate: '2024/01/01',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z'
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(InvalidTargetDate);
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow('対象日付が不正です。');
  });

  it('targetDateが不正な形式"invalid-date"の場合にInvalidTargetDateエラーが発生する', async () => {
    const input = {
      targetDate: 'invalid-date',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z'
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(InvalidTargetDate);
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow('対象日付が不正です。');
  });

  it('targetDateが空文字列の場合にInvalidTargetDateエラーが発生する', async () => {
    const input = {
      targetDate: '',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z'
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(InvalidTargetDate);
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow('対象日付が不正です。');
  });
});
