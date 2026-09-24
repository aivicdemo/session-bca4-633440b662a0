import { describe, test, expect } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  DatabasePersistenceError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-426: データベース保存処理が失敗するとDatabasePersistenceErrorが発生する', () => {
  test('should throw DatabasePersistenceError when database persistence fails', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      submittedAt: '2024-01-15T14:30:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(DatabasePersistenceError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      '日報の保存に失敗しました。システム管理者に連絡してください。'
    );
  });
});
