import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  saveDailyReport,
  InvalidUserIdError,
  InvalidReportDateError,
  EmptyContentError,
  DuplicateSubmissionError,
  DatabasePersistenceError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-427: 設計済みのいずれかのエラー条件に該当する場合、saveDailyReportが対応するエラーを発生する', () => {
  it('TestCase1: should throw InvalidUserIdError for invalid userId', async () => {
    const input = {
      userId: 'invalid-user-id',
      reportDate: '2024-01-15',
      businessContent: '営業活動',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidUserIdError);
    await expect(saveDailyReport(input)).rejects.toThrow('指定されたユーザーIDは無効です。');
  });

  it('TestCase2: should throw InvalidReportDateError for non-business day', async () => {
    const input = {
      userId: 'user-001',
      reportDate: '2024-01-14',
      businessContent: '営業活動',
      submittedAt: '2024-01-14T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidReportDateError);
    await expect(saveDailyReport(input)).rejects.toThrow('報告日は営業日である必要があります。');
  });

  it('TestCase3: should throw EmptyContentError for empty businessContent', async () => {
    const input = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(EmptyContentError);
    await expect(saveDailyReport(input)).rejects.toThrow('業務内容は必須項目です。');
  });

  it('TestCase4: should throw DuplicateSubmissionError for duplicate report', async () => {
    const firstInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '初回報告',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    try {
      await saveDailyReport(firstInput);
    } catch {
      // ignore if already exists
    }

    const secondInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '二回目の報告',
      submittedAt: '2024-01-15T14:30:00Z',
    };

    await expect(saveDailyReport(secondInput)).rejects.toThrow(DuplicateSubmissionError);
    await expect(saveDailyReport(secondInput)).rejects.toThrow('この日付の日報は既に提出されています。');
  });

  it('TestCase5: should throw DatabasePersistenceError for database failure', async () => {
    const input = {
      userId: 'user001',
      reportDate: '2024-01-15',
      businessContent: '顧客打ち合わせ',
      submittedAt: '2024-01-15T14:30:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(DatabasePersistenceError);
    await expect(saveDailyReport(input)).rejects.toThrow('日報の保存に失敗しました。システム管理者に連絡してください。');
  });
});
