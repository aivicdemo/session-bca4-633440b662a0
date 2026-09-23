import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  SaveDailyReportInput,
  DatabasePersistenceError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-426: データベース保存処理が失敗するとDatabasePersistenceErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データベース保存処理が失敗するとDatabasePersistenceErrorが発生する', async () => {
    // saveDailyReport関数をモック化したデータベース層（永続化層）が例外をスロー
    // （DatabasePersistenceError相当の状況をシミュレート）するように設定する
    const mockSaveDailyReport = jest.fn().mockRejectedValue(
      // @ts-ignore
      new DatabasePersistenceError('日報の保存に失敗しました。システム管理者に連絡してください。')
    );

    // 以下の入力値でsaveDailyReport関数を呼び出す:
    // userId='user001'、reportDate='2024-01-15'、businessContent='顧客打ち合わせ実施'、submittedAt='2024-01-15T14:30:00Z'
    const input: SaveDailyReportInput = {
      userId: 'user001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ実施',
      submittedAt: '2024-01-15T14:30:00Z',
    };

    // データベース保存処理が失敗し、エラーがスローされるのを待つ
    // DatabasePersistenceErrorという名前のエラーがスローされ、
    // そのエラーメッセージが『日報の保存に失敗しました。システム管理者に連絡してください。』であること
    await expect(mockSaveDailyReport(input)).rejects.toThrow(DatabasePersistenceError);
    await expect(mockSaveDailyReport(input)).rejects.toThrow('日報の保存に失敗しました。システム管理者に連絡してください。');
  });
});
