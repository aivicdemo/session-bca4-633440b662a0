import { describe, test, expect } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  InvalidReportDateError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-422: 未来日の報告日で日報保存を試みるとInvalidReportDateErrorが発生する', () => {
  test('should throw InvalidReportDateError when reportDate is in the future', async () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 1);

    const futureDateStr = futureDate.toISOString().split('T')[0];
    const futureSubmittedAt = futureDate.toISOString();

    const input: SaveDailyReportInput = {
      userId: 'user-001',
      reportDate: futureDateStr,
      businessContent: '業務内容',
      submittedAt: futureSubmittedAt,
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidReportDateError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      '報告日は営業日である必要があります。'
    );
  });
});
