import { describe, it, expect } from '@jest/globals';
import { saveDailyReport, InvalidUserIdError } from '../../src/logic/daily-report-persistence';

describe('SCEN-420: 無効なユーザーIDで日報保存を試みるとInvalidUserIdErrorが発生する', () => {
  it('should throw InvalidUserIdError when saving daily report with invalid userId', async () => {
    const input = {
      userId: 'invalid-user-id',
      reportDate: '2025-01-15',
      businessContent: '本日の業務内容',
      submittedAt: '2025-01-15T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidUserIdError);
    await expect(saveDailyReport(input)).rejects.toThrow('指定されたユーザーIDは無効です。');
  });
});
