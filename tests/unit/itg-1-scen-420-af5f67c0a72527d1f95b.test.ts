import { describe, test, expect } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  InvalidUserIdError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-420: 無効または存在しないユーザーIDで日報保存を試みるとInvalidUserIdErrorが発生する', () => {
  test('should throw InvalidUserIdError with invalid user ID', async () => {
    const input: SaveDailyReportInput = {
      userId: 'invalid-user-id',
      reportDate: '2025-01-15',
      businessContent: '本日の業務内容',
      submittedAt: '2025-01-15T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidUserIdError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      '指定されたユーザーIDは無効です。'
    );
  });
});
