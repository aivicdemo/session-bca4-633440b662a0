import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  SaveDailyReportOutput,
  EmptyContentError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-423: 空文字列の業務内容で日報保存を試みるとEmptyContentErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('空文字列の業務内容で日報保存を試みるとEmptyContentErrorが発生する', async () => {
    // 入力型 SaveDailyReportInput を構築する。businessContent に空文字列 "" を設定し、
    // その他のフィールド（userId: "user-001"、reportDate: "2024-01-15"、submittedAt: "2024-01-15T09:00:00Z"）は有効な値を設定する。
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    // saveDailyReport 関数を構築した入力値で呼び出す。
    // 関数が例外をスロー（throw）することを確認する。
    // EmptyContentError 例外がスローされ、エラー文言は「業務内容は必須項目です。」である。
    // saveDailyReport は日報レコードを保存せず、SaveDailyReportOutput を返さない。
    await expect(saveDailyReport(input)).rejects.toThrow(EmptyContentError);
    await expect(saveDailyReport(input)).rejects.toThrow('業務内容は必須項目です。');
  });
});
