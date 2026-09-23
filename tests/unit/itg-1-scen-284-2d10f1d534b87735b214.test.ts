import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  InvalidNonSubmitterInput,
} from '../../src/logic/non-submission-prompt-decision';

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  isWithinSubmissionDeadline: jest.fn(),
}));

describe('SCEN-284: 必須フィールド（userId、targetDate、detectionDateTime）が不足している場合、InvalidNonSubmitterInputエラーが発生する', () => {
  let mockIsWithinSubmissionDeadline: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsWithinSubmissionDeadline = require('../../src/logic/business-day-deadline-judgment.ts')
      .isWithinSubmissionDeadline as jest.Mock;
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

  it('targetDate が undefined の場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: undefined,
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

  it('detectionDateTime が空文字列の場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidNonSubmitterInput);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      '未提出者情報の必須項目が不足しているか形式が不正です。'
    );
  });

  it('userId、targetDate、detectionDateTime のすべてが不足した場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: null,
      targetDate: undefined,
      detectionDateTime: '',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    } as any;

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidNonSubmitterInput);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(
      '未提出者情報の必須項目が不足しているか形式が不正です。'
    );
  });

  it('targetDate が YYYY-MM-DD 形式以外（例：2024/01/01）の場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024/01/01',
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

  it('detectionDateTime が ISO 8601 形式以外（例：2024-01-01 10:30:00）の場合、InvalidNonSubmitterInput エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-01 10:30:00',
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
