import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-177: 日報提出期限の時刻形式が不正のとき例外がスローされる', () => {
  it('日報提出期限の時刻が不正な形式（例：「25:00」）でエラーが発生する', async () => {
    // 営業日カレンダーが設定済み、チームリーダーが日報提出期限を定義しているが、
    // 時刻が不正な形式（例：「25:00」）で設定されている状況
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'TL001',
      reporterUserId: 'R001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
    };

    // 業務ルール br-tx_4-008 の制約で定義されたエラーが発生することを期待
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(
      '期限時刻の形式が不正です。HH:MM形式で設定してください'
    );
  });

  it('日報提出期限の時刻が不正な形式（例：「17-00」）でエラーが発生する', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'TL-invalid-format-17-00',
      reporterUserId: 'R001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(
      '期限時刻の形式が不正です。HH:MM形式で設定してください'
    );
  });

  it('日報提出期限の時刻が不正な形式（例：「17:00:00」）でエラーが発生する', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'TL-invalid-format-17-00-00',
      reporterUserId: 'R001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(
      '期限時刻の形式が不正です。HH:MM形式で設定してください'
    );
  });
});
