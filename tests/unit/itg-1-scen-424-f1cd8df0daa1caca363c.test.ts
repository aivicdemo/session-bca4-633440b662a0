import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  EmptyContentError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-424: 空白のみの業務内容で日報保存を試みるとEmptyContentErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('空白のみの業務内容で日報保存を試みるとEmptyContentErrorが発生する', async () => {
    // saveDailyReport関数を呼び出す際、入力型SaveDailyReportInputの以下の値を設定する:
    // userId='user-001'（有効なユーザーID）、reportDate='2024-01-15'（営業日）、
    // businessContent='   '（スペースのみ）、submittedAt='2024-01-15T09:00:00Z'
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '   ',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    // saveDailyReport関数を実行する
    // EmptyContentErrorが発生する。エラーメッセージは『業務内容は必須項目です。』である。
    // 日報レコードはデータベースに保存されない。
    await expect(saveDailyReport(input)).rejects.toThrow(EmptyContentError);
    await expect(saveDailyReport(input)).rejects.toThrow('業務内容は必須項目です。');
  });
});
