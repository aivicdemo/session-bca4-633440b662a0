import { describe, it, expect, vi } from '@jest/globals';
import { saveDailyReport, DatabasePersistenceError } from '../../src/logic/daily-report-persistence';

describe('SCEN-426: データベース保存処理が失敗するとDatabasePersistenceErrorが発生する', () => {
  it('should throw DatabasePersistenceError when database persistence fails', async () => {
    const input = {
      userId: 'user001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      submittedAt: '2024-01-15T14:30:00Z',
    };

    // Mock saveDailyReport to simulate database error
    // This is expected to fail when database layer throws error
    await expect(saveDailyReport(input)).rejects.toThrow(DatabasePersistenceError);
    await expect(saveDailyReport(input)).rejects.toThrow('日報の保存に失敗しました。システム管理者に連絡してください。');
  });
});
