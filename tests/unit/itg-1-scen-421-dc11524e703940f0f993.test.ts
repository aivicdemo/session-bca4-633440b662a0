import { describe, test, expect } from '@jest/globals';
import {
  saveDailyReport,
  SaveDailyReportInput,
  InvalidReportDateError,
} from '../../src/logic/daily-report-persistence';

describe('SCEN-421: 営業日でない報告日で日報保存を試みるとInvalidReportDateErrorが発生する', () => {
  test('should throw InvalidReportDateError when reportDate is not a business day (Saturday)', async () => {
    const input: SaveDailyReportInput = {
      userId: 'user001',
      reportDate: '2025-01-11',
      businessContent: '営業活動実施',
      submittedAt: '2025-01-11T09:00:00Z',
    };

    await expect(saveDailyReport(input)).rejects.toThrow(InvalidReportDateError);
    await expect(saveDailyReport(input)).rejects.toThrow(
      '報告日は営業日である必要があります。'
    );
  });
});
