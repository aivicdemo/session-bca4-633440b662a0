import { describe, test, expect } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  EmptyContentError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-424: 空白のみの業務内容で日報保存を試みるとEmptyContentErrorが発生する', () => {
  test('should throw EmptyContentError when businessContent is whitespace only', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: '2024-01-15',
      businessContent: '   ',
      submittedAt: '2024-01-15T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(EmptyContentError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      '業務内容は必須項目です。'
    );
  });
});
