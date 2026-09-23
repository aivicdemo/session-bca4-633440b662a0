import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  InvalidNonSubmitterInput,
} from '../../src/logic/non-submission-prompt-decision';

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  isWithinSubmissionDeadline: jest.fn(),
}));

describe('SCEN-285: userId、targetDate、detectionDateTimeの形式が不正な場合、InvalidNonSubmitterInputエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('userId が空文字列の場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: '',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidNonSubmitterInput);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      '未提出者情報の必須項目が不足しているか形式が不正です。'
    );
  });

  it('userId が null の場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: null,
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidNonSubmitterInput);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      '未提出者情報の必須項目が不足しているか形式が不正です。'
    );
  });

  it('targetDate が YYYY/MM/DD 形式（不正な形式）の場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024/01/15',
      detectionDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidNonSubmitterInput);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      '未提出者情報の必須項目が不足しているか形式が不正です。'
    );
  });

  it('detectionDateTime が ISO 8601 形式でない "2024-01-15 10:30:00" 形式の場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15 10:30:00',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidNonSubmitterInput);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      '未提出者情報の必須項目が不足しているか形式が不正です。'
    );
  });

  it('detectionDateTime が "invalid-datetime" （ISO 8601 形式でない不正な値）の場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: 'invalid-datetime',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidNonSubmitterInput);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      '未提出者情報の必須項目が不足しているか形式が不正です。'
    );
  });
});
