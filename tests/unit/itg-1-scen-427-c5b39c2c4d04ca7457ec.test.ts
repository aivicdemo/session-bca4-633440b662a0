import { describe, test, expect } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  InvalidUserIdError,
  InvalidReportDateError,
  EmptyContentError,
  DuplicateSubmissionError,
  DatabasePersistenceError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-427: 設計済みのいずれかのエラー条件に該当する場合、saveDailyReportが対応するエラーを発生する', () => {
  test('should throw InvalidUserIdError for invalid user ID', async () => {
    const input: SaveDailyReportInput = {
      userId: 'invalid-user-id',
      reportDate: '2024-01-15',
      businessContent: '業務内容',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidUserIdError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      '指定されたユーザーIDは無効です。'
    );
  });

  test('should throw InvalidReportDateError for non-business day', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2025-01-12',
      businessContent: '業務内容',
      submittedAt: '2025-01-12T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidReportDateError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      '報告日は営業日である必要があります。'
    );
  });

  test('should throw EmptyContentError for empty business content', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(EmptyContentError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      '業務内容は必須項目です。'
    );
  });

  test('should throw DuplicateSubmissionError for duplicate submission', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '業務内容',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(DuplicateSubmissionError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      'この日付の日報は既に提出されています。'
    );
  });

  test('should throw DatabasePersistenceError for database failure', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '業務内容',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(DatabasePersistenceError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      '日報の保存に失敗しました。システム管理者に連絡してください。'
    );
  });
});
