import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  InvalidUserIdError,
  InvalidReportDateError,
  EmptyContentError,
  DuplicateSubmissionError,
  DatabasePersistenceError,
} from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/daily-report-persistence.ts');

describe('SCEN-427: 設計済みのいずれかのエラー条件に該当する場合、saveDailyReportが対応するエラーを発生する', () => {
  let mockCheckDailyReportExistsForDate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const module = require('../../src/logic/daily-report-persistence.ts');
    mockCheckDailyReportExistsForDate = module.checkDailyReportExistsForDate as jest.Mock;
  });

  it('テストケース1: InvalidUserIdError - userId に無効または存在しないユーザーIDを指定して saveDailyReport を呼び出す', async () => {
    const input: SaveDailyReportInput = {
      userId: 'invalid-user-id',
      reportDate: '2024-01-15',
      businessContent: '営業活動',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    // InvalidUserIdError が発生し、エラー文言は「指定されたユーザーIDは無効です。」
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow(InvalidUserIdError);
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow('指定されたユーザーIDは無効です。');
  });

  it('テストケース2: InvalidReportDateError - reportDate に営業日でない日付（例：日曜日）または未来日を指定して saveDailyReport を呼び出す', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-21',
      businessContent: '営業活動',
      submittedAt: '2024-01-21T09:00:00Z',
    };

    // InvalidReportDateError が発生し、エラー文言は「報告日は営業日である必要があります。」
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow(InvalidReportDateError);
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow('報告日は営業日である必要があります。');
  });

  it('テストケース3: EmptyContentError - businessContent に空文字列または空白のみを指定して saveDailyReport を呼び出す', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    // EmptyContentError が発生し、エラー文言は「業務内容は必須項目です。」
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow(EmptyContentError);
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow('業務内容は必須項目です。');
  });

  it('テストケース4: DuplicateSubmissionError - 同一の userId と reportDate で既に保存されている日報に対して同じ入力で saveDailyReport を呼び出す', async () => {
    // @ts-ignore
    mockCheckDailyReportExistsForDate.mockResolvedValue(true);

    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    // DuplicateSubmissionError が発生し、エラー文言は「この日付の日報は既に提出されています。」
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow(DuplicateSubmissionError);
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow('この日付の日報は既に提出されています。');
  });

  it('テストケース5: DatabasePersistenceError - データベース保存処理が失敗する条件下で saveDailyReport を呼び出す（例：接続エラー、制約違反など）', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '営業活動',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    // DatabasePersistenceError が発生し、エラー文言は「日報の保存に失敗しました。システム管理者に連絡してください。」
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow(DatabasePersistenceError);
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow('日報の保存に失敗しました。システム管理者に連絡してください。');
  });
});
