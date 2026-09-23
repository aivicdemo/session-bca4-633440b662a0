import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  DuplicateSubmissionError,
} from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/daily-report-persistence.ts');

describe('SCEN-425: 同一ユーザーIDと報告日の日報が既に存在する場合にDuplicateSubmissionErrorが発生する', () => {
  let mockCheckDailyReportExistsForDate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const module = require('../../src/logic/daily-report-persistence.ts');
    mockCheckDailyReportExistsForDate = module.checkDailyReportExistsForDate as jest.Mock;
    // @ts-ignore
    mockCheckDailyReportExistsForDate.mockResolvedValue(true);
  });

  it('同一ユーザーIDと報告日の日報が既に存在する場合にDuplicateSubmissionErrorが発生する', async () => {
    // テストデータとして、有効なユーザーID「user-001」、報告日「2024-01-15」、業務内容「営業活動」を用意する
    // 同一のユーザーID「user-001」と報告日「2024-01-15」で、既に保存されている日報レコードをデータベースに事前に作成する

    // saveDailyReport関数に以下の入力値を渡す:
    // userId="user-001", reportDate="2024-01-15", businessContent="本日の業務内容", submittedAt="2024-01-15T14:30:00Z"
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      submittedAt: '2024-01-15T14:30:00Z',
    };

    // 関数の戻り値またはエラーハンドリングの結果を確認する
    // DuplicateSubmissionErrorが発生し、エラーメッセージとして「この日付の日報は既に提出されています。」が返される。
    // 出力型SaveDailyReportOutputは返されない。
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow(DuplicateSubmissionError);
    // @ts-ignore
    await expect(saveDailyReport(input)).rejects.toThrow('この日付の日報は既に提出されています。');
  });
});
